/**
 * Core Time Scheduling Engine for Tournament Management
 * Handles court assignment, time slot calculation, and collision prevention
 *
 * Algorithm Complexity:
 * - scheduleMatches: O(m * c * d) where m = matches, c = courts, d = days
 * - findNextAvailableSlot: O(c) where c = number of courts
 * - Optimization: Greedy algorithm prioritizes earliest available court
 */

export interface ScheduleConfig {
  numberOfCourts: number;
  gameDurationMinutes: number;
  breakDurationMinutes: number;
  tournamentStartDate: string; // ISO datetime string
  numberOfDays: number;
  dailyStartTime: string; // "HH:MM" format (e.g., "09:00")
  dailyEndTime: string; // "HH:MM" format (e.g., "18:00")
}

export interface MatchToSchedule {
  gameId?: number; // Optional for already created matches
  team1Id: number | null;
  team2Id: number | null;
  roundNumber: number;
  gameNumber: number;
  bracketType: "winners" | "losers" | "finals";
  groupId?: number;
  parentMatchId?: number;
  childMatchId?: number;
}

export interface ScheduledMatch extends MatchToSchedule {
  scheduledTime: string; // ISO datetime string for database
  courtNumber: number;
  estimatedEndTime: Date;
}

interface CourtAvailability {
  courtNumber: number;
  nextAvailableTime: Date;
}

interface DaySchedule {
  dayNumber: number;
  date: Date;
  startTime: Date;
  endTime: Date;
}

export class TimeScheduler {
  private config: ScheduleConfig;
  private daySchedules: DaySchedule[];
  private courtAvailability: Map<number, Date>; // court number -> next available time
  private tournamentStartDate: Date;

  constructor(config: ScheduleConfig) {
    this.config = config;
    this.tournamentStartDate = new Date(config.tournamentStartDate);
    this.daySchedules = this.generateDaySchedules();
    this.courtAvailability = new Map();

    // Initialize all courts as available at tournament start
    for (let i = 1; i <= config.numberOfCourts; i++) {
      this.courtAvailability.set(i, this.daySchedules[0].startTime);
    }

    console.log(`TimeScheduler initialized:`, {
      startDate: this.tournamentStartDate.toISOString(),
      days: this.daySchedules.length,
      courts: config.numberOfCourts,
      dailyWindow: `${config.dailyStartTime} - ${config.dailyEndTime}`,
      gameDuration: config.gameDurationMinutes,
      breakDuration: config.breakDurationMinutes,
    });
  }

  /**
   * Generate day schedules for the tournament duration
   * Time Complexity: O(d) where d = number of days
   */
  private generateDaySchedules(): DaySchedule[] {
    const schedules: DaySchedule[] = [];

    for (let day = 0; day < this.config.numberOfDays; day++) {
      // Create date for this day
      const currentDate = new Date(this.tournamentStartDate);
      currentDate.setDate(currentDate.getDate() + day);

      // Parse daily start and end times
      const [startHour, startMinute] = this.config.dailyStartTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = this.config.dailyEndTime
        .split(":")
        .map(Number);

      // Create start time for this day
      const dayStart = new Date(currentDate);
      dayStart.setHours(startHour, startMinute, 0, 0);

      // Create end time for this day
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      schedules.push({
        dayNumber: day + 1,
        date: currentDate,
        startTime: dayStart,
        endTime: dayEnd,
      });

      console.log(`Day ${day + 1} schedule:`, {
        date: currentDate.toDateString(),
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
      });
    }

    return schedules;
  }

  /**
   * Main scheduling algorithm - assigns times and courts to matches
   * Time Complexity: O(m * c * d) where:
   *   m = number of matches
   *   c = number of courts
   *   d = number of days
   *
   * Strategy: Greedy algorithm that assigns each match to the earliest
   * available court that doesn't conflict with team schedules
   */
  public scheduleMatches(matches: MatchToSchedule[]): ScheduledMatch[] {
    const scheduledMatches: ScheduledMatch[] = [];
    const teamNextAvailable = new Map<number, Date>(); // Track when each team is next available

    console.log(`\n🎯 Scheduling ${matches.length} matches...`);

    for (const match of matches) {
      // Handle matches with TBD teams (byes or pending)
      const team1Available =
        (match.team1Id && teamNextAvailable.get(match.team1Id)) ||
        this.daySchedules[0].startTime;
      const team2Available =
        (match.team2Id && teamNextAvailable.get(match.team2Id)) ||
        this.daySchedules[0].startTime;
      const earliestTeamTime =
        team1Available > team2Available ? team1Available : team2Available;

      // Find next available court slot that's after teams are available
      const slot = this.findNextAvailableSlot(earliestTeamTime);

      if (!slot) {
        throw new Error(
          `Unable to schedule match ${match.gameNumber} in round ${match.roundNumber}. ` +
            `Tournament duration insufficient. Consider adding more days or courts.`,
        );
      }

      const matchEndTime = new Date(slot.scheduledTime);
      matchEndTime.setMinutes(
        matchEndTime.getMinutes() +
          this.config.gameDurationMinutes +
          this.config.breakDurationMinutes,
      );

      // Schedule the match
      scheduledMatches.push({
        ...match,
        scheduledTime: slot.scheduledTime.toISOString(), // Convert to ISO string for database
        courtNumber: slot.courtNumber,
        estimatedEndTime: matchEndTime,
      });

      console.log(
        `  ✅ Match ${match.gameNumber}: Court ${slot.courtNumber} at ${slot.scheduledTime.toISOString()}`,
      );

      // Update court availability (after game + break)
      this.courtAvailability.set(slot.courtNumber, matchEndTime);

      // Update team availability (teams can't play another match until this one ends + break)
      if (match.team1Id) {
        teamNextAvailable.set(match.team1Id, matchEndTime);
      }
      if (match.team2Id) {
        teamNextAvailable.set(match.team2Id, matchEndTime);
      }
    }

    console.log(
      `✅ Successfully scheduled ${scheduledMatches.length} matches\n`,
    );

    return scheduledMatches;
  }

  /**
   * Find the next available court slot after a given time
   * Time Complexity: O(c * d) where c = courts, d = days
   *
   * Algorithm:
   * 1. Check all courts for earliest availability
   * 2. If no court available in current day window, move to next day
   * 3. Ensure match can complete within daily time window
   */
  private findNextAvailableSlot(
    afterTime: Date,
  ): { scheduledTime: Date; courtNumber: number } | null {
    let searchTime = new Date(afterTime);

    // Try to find a slot within tournament days
    for (const daySchedule of this.daySchedules) {
      // Skip days that are before our search time
      if (daySchedule.endTime < searchTime) {
        continue;
      }

      // If search time is before this day starts, reset to day start
      if (searchTime < daySchedule.startTime) {
        searchTime = new Date(daySchedule.startTime);
      }

      // Find earliest available court on this day
      let earliestCourt: number | null = null;
      let earliestTime: Date | null = null;

      for (
        let courtNum = 1;
        courtNum <= this.config.numberOfCourts;
        courtNum++
      ) {
        const courtAvailable = this.courtAvailability.get(courtNum)!;

        // Court available time on this day
        let courtTime =
          courtAvailable > searchTime ? courtAvailable : searchTime;

        // Ensure court time is within daily window
        if (courtTime < daySchedule.startTime) {
          courtTime = daySchedule.startTime;
        }

        // Check if match can complete before day ends
        const matchEndTime = new Date(courtTime);
        matchEndTime.setMinutes(
          matchEndTime.getMinutes() + this.config.gameDurationMinutes,
        );

        if (matchEndTime <= daySchedule.endTime) {
          // This court can accommodate the match
          if (!earliestTime || courtTime < earliestTime) {
            earliestTime = courtTime;
            earliestCourt = courtNum;
          }
        }
      }

      // If we found an available court on this day, return it
      if (earliestCourt && earliestTime) {
        return {
          scheduledTime: earliestTime,
          courtNumber: earliestCourt,
        };
      }

      // Move search time to start of next day
      const nextDayIndex = this.daySchedules.indexOf(daySchedule) + 1;
      if (nextDayIndex < this.daySchedules.length) {
        searchTime = new Date(this.daySchedules[nextDayIndex].startTime);
      }
    }

    // No available slot found within tournament duration
    return null;
  }

  /**
   * Validate that a schedule configuration is feasible
   * Time Complexity: O(1)
   */
  public validateConfiguration(): { valid: boolean; message?: string } {
    // Check that daily time window is sufficient for at least one game
    const [startHour, startMinute] = this.config.dailyStartTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = this.config.dailyEndTime
      .split(":")
      .map(Number);

    const dailyMinutes =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);
    const minimumRequired =
      this.config.gameDurationMinutes + this.config.breakDurationMinutes;

    if (dailyMinutes < minimumRequired) {
      return {
        valid: false,
        message:
          `Daily time window (${dailyMinutes} minutes) is insufficient for even one game ` +
          `(requires ${minimumRequired} minutes including break time).`,
      };
    }

    if (this.config.numberOfCourts < 1) {
      return {
        valid: false,
        message: "At least one court is required.",
      };
    }

    if (this.config.numberOfDays < 1) {
      return {
        valid: false,
        message: "Tournament must be at least one day long.",
      };
    }

    return { valid: true };
  }

  /**
   * Calculate estimated tournament completion time
   * Time Complexity: O(1)
   */
  public estimateTournamentDuration(numberOfMatches: number): {
    estimatedEndTime: Date;
    totalDaysUsed: number;
    warning?: string;
  } {
    // Calculate total minutes needed
    const minutesPerMatch =
      this.config.gameDurationMinutes + this.config.breakDurationMinutes;
    const totalMinutesNeeded = numberOfMatches * minutesPerMatch;

    // Calculate how many matches can fit per day across all courts
    const [startHour, startMinute] = this.config.dailyStartTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = this.config.dailyEndTime
      .split(":")
      .map(Number);
    const dailyMinutes =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);

    const matchesPerCourtPerDay = Math.floor(dailyMinutes / minutesPerMatch);
    const matchesPerDay = matchesPerCourtPerDay * this.config.numberOfCourts;

    // Calculate days needed
    const daysNeeded = Math.ceil(numberOfMatches / matchesPerDay);

    // Find estimated end time
    let estimatedEndTime = new Date(this.daySchedules[0].startTime);

    if (daysNeeded <= this.config.numberOfDays) {
      // Tournament fits within allocated days
      const lastDay =
        this.daySchedules[
          Math.min(daysNeeded - 1, this.daySchedules.length - 1)
        ];
      const remainingMatches = numberOfMatches % matchesPerDay || matchesPerDay;
      const minutesOnLastDay =
        Math.ceil(remainingMatches / this.config.numberOfCourts) *
        minutesPerMatch;

      estimatedEndTime = new Date(lastDay.startTime);
      estimatedEndTime.setMinutes(
        estimatedEndTime.getMinutes() + minutesOnLastDay,
      );
    } else {
      // Tournament exceeds allocated days
      estimatedEndTime =
        this.daySchedules[this.daySchedules.length - 1].endTime;
    }

    console.log(`📊 Tournament Duration Estimate:`, {
      totalMatches: numberOfMatches,
      matchesPerDay,
      daysNeeded,
      daysAllocated: this.config.numberOfDays,
      estimatedEnd: estimatedEndTime.toISOString(),
    });

    return {
      estimatedEndTime,
      totalDaysUsed: Math.min(daysNeeded, this.config.numberOfDays),
      warning:
        daysNeeded > this.config.numberOfDays
          ? `Tournament requires ${daysNeeded} days but only ${this.config.numberOfDays} allocated. ` +
            `Consider adding ${daysNeeded - this.config.numberOfDays} more day(s) or increasing courts.`
          : undefined,
    };
  }

  /**
   * Get current court availability status
   * Time Complexity: O(c) where c = number of courts
   */
  public getCourtAvailability(): CourtAvailability[] {
    const availability: CourtAvailability[] = [];

    for (let courtNum = 1; courtNum <= this.config.numberOfCourts; courtNum++) {
      availability.push({
        courtNumber: courtNum,
        nextAvailableTime: this.courtAvailability.get(courtNum)!,
      });
    }

    return availability.sort(
      (a, b) => a.nextAvailableTime.getTime() - b.nextAvailableTime.getTime(),
    );
  }
}
