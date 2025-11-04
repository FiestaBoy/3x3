"use client";

import { useState } from "react";
import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { generateTournamentSchedule } from "@/src/lib/db/tournamentScheduler";

interface ScheduleMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournament: any;
  onScheduleGenerated: () => void;
}

export default function ScheduleMatchesModal({
  isOpen,
  onClose,
  tournamentId,
  tournament,
  onScheduleGenerated,
}: ScheduleMatchesModalProps) {
  const [formData, setFormData] = useState({
    numberOfCourts: 2,
    gameDurationMinutes: 15,
    breakDurationMinutes: 5,
    tournamentStartDateTime: "",
    numberOfDays: 1,
    dailyStartTime: "09:00",
    dailyEndTime: "18:00",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    details?: any;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setResult(null);

    try {
      // Validate start date/time
      if (!formData.tournamentStartDateTime) {
        setResult({
          type: "error",
          message: "Please select tournament start date and time",
        });
        setIsGenerating(false);
        return;
      }

      // Validate daily time window
      const startTime = formData.dailyStartTime.split(":").map(Number);
      const endTime = formData.dailyEndTime.split(":").map(Number);
      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];

      if (endMinutes <= startMinutes) {
        setResult({
          type: "error",
          message: "Daily end time must be after start time",
        });
        setIsGenerating(false);
        return;
      }

      const response = await generateTournamentSchedule({
        tournamentId,
        numberOfCourts: formData.numberOfCourts,
        gameDurationMinutes: formData.gameDurationMinutes,
        breakDurationMinutes: formData.breakDurationMinutes,
        tournamentStartDateTime: formData.tournamentStartDateTime,
        numberOfDays: formData.numberOfDays,
        dailyStartTime: formData.dailyStartTime,
        dailyEndTime: formData.dailyEndTime,
      });

      if (response.success) {
        setResult({
          type: "success",
          message: response.message,
          details: {
            totalMatches: response.totalMatches,
            estimatedEndTime: response.estimatedEndTime,
            daysUsed: response.daysUsed,
          },
        });

        // Notify parent component
        setTimeout(() => {
          onScheduleGenerated();
          onClose();
        }, 2000);
      } else {
        setResult({
          type: "error",
          message: response.message,
        });
      }
    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to generate schedule",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatEstimatedEndTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-2xl mb-2">Generate Tournament Schedule</h3>
            <p className="text-sm text-base-content/70">
              Configure scheduling parameters for {tournament.name}
            </p>
          </div>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            disabled={isGenerating}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tournament Info */}
        <div className="alert alert-info mb-6">
          <div className="flex items-start gap-3">
            <Calendar size={20} className="mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Tournament Details</div>
              <div className="text-sm space-y-1">
                <div>Format: {tournament.format.replace(/_/g, " ").toUpperCase()}</div>
                <div>Registered Teams: {tournament.registered_teams || 0}</div>
                <div>Age Group: {tournament.age_group}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Court Configuration */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <MapPin size={18} />
              Court Configuration
            </h4>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Number of Courts Available</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="input input-bordered"
                value={formData.numberOfCourts}
                onChange={(e) =>
                  handleInputChange("numberOfCourts", parseInt(e.target.value))
                }
                required
              />
              <label className="label">
                <span className="label-text-alt">
                  How many courts can be used simultaneously?
                </span>
              </label>
            </div>
          </div>

          {/* Game Timing */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock size={18} />
              Game Timing
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Game Duration (minutes)</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  className="input input-bordered"
                  value={formData.gameDurationMinutes}
                  onChange={(e) =>
                    handleInputChange("gameDurationMinutes", parseInt(e.target.value))
                  }
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Break Between Games (minutes)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  className="input input-bordered"
                  value={formData.breakDurationMinutes}
                  onChange={(e) =>
                    handleInputChange("breakDurationMinutes", parseInt(e.target.value))
                  }
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    Break time applies between ALL games
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Tournament Schedule */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar size={18} />
              Tournament Schedule
            </h4>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Tournament Start Date & Time
                </span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={formData.tournamentStartDateTime}
                onChange={(e) =>
                  handleInputChange("tournamentStartDateTime", e.target.value)
                }
                required
              />
              <label className="label">
                <span className="label-text-alt">
                  When should the first game start?
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Number of Days</span>
              </label>
              <input
                type="number"
                min="1"
                max="14"
                className="input input-bordered"
                value={formData.numberOfDays}
                onChange={(e) =>
                  handleInputChange("numberOfDays", parseInt(e.target.value))
                }
                required
              />
              <label className="label">
                <span className="label-text-alt">
                  How many days are courts available?
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Daily Start Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered"
                  value={formData.dailyStartTime}
                  onChange={(e) => handleInputChange("dailyStartTime", e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Daily End Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered"
                  value={formData.dailyEndTime}
                  onChange={(e) => handleInputChange("dailyEndTime", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`alert ${
                result.type === "success" ? "alert-success" : "alert-error"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <div className="flex-1">
                <div className="font-semibold">{result.message}</div>
                {result.details && (
                  <div className="text-sm mt-2 space-y-1">
                    <div>Total Matches: {result.details.totalMatches}</div>
                    <div>Days Used: {result.details.daysUsed}</div>
                    <div>
                      Estimated Completion:{" "}
                      {formatEstimatedEndTime(result.details.estimatedEndTime)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Generating Schedule...
                </>
              ) : (
                "Generate Schedule"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}