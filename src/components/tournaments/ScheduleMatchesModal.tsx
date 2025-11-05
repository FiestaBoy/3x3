"use client";

import { useState } from "react";
import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle, Info } from "lucide-react";
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
  // Calculate number of days from tournament start/end dates
  const getNumberOfDays = () => {
    const start = new Date(tournament.start_date);
    const end = new Date(tournament.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const [formData, setFormData] = useState({
    numberOfCourts: 2,
    breakDurationMinutes: 5,
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
      // Validate time window
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
        breakDurationMinutes: formData.breakDurationMinutes,
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

        // Close modal after success
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
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-xl">Generate Tournament Schedule</h3>
            <p className="text-sm text-base-content/70 mt-1">{tournament.name}</p>
          </div>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            disabled={isGenerating}
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Alert */}
        <div className="alert mb-6">
          <Info size={20} />
          <div className="text-sm">
            <div className="font-semibold mb-2">Tournament Information</div>
            <div className="space-y-1 text-xs opacity-80">
              <div>• Start Date: {new Date(tournament.start_date).toLocaleDateString()}</div>
              <div>• End Date: {new Date(tournament.end_date).toLocaleDateString()}</div>
              <div>• Duration: {getNumberOfDays()} day(s)</div>
              <div>• Game Duration: {tournament.game_duration} minutes</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Court & Venue Settings */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin size={16} />
                Venue Configuration
              </h4>

              <div className="form-control flex flex-col">
                <label className="label">
                  <span className="label-text">Number of Courts</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="input input-bordered input-sm"
                  value={formData.numberOfCourts}
                  onChange={(e) =>
                    handleInputChange("numberOfCourts", parseInt(e.target.value))
                  }
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    Courts available for simultaneous matches
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Break Time */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock size={16} />
                Break Between Matches
              </h4>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Break Duration</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="5"
                    className="input input-bordered input-sm flex-1"
                    value={formData.breakDurationMinutes}
                    onChange={(e) =>
                      handleInputChange("breakDurationMinutes", parseInt(e.target.value))
                    }
                    required
                  />
                  <span className="text-sm">minutes</span>
                </div>
                <label className="label">
                  <span className="label-text-alt">Time buffer between games on the same court</span>
                </label>
              </div>
            </div>
          </div>

          {/* Daily Schedule */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Daily Operating Hours
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Time</span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered input-sm"
                    value={formData.dailyStartTime}
                    onChange={(e) => handleInputChange("dailyStartTime", e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">End Time</span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered input-sm"
                    value={formData.dailyEndTime}
                    onChange={(e) => handleInputChange("dailyEndTime", e.target.value)}
                    required
                  />
                </div>
              </div>
              <label className="label">
                <span className="label-text-alt">When the venue is available each day</span>
              </label>
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
                    <div>✓ {result.details.totalMatches} matches scheduled</div>
                    <div>✓ {result.details.daysUsed} day(s) used</div>
                    <div>
                      ✓ Completes: {formatEstimatedEndTime(result.details.estimatedEndTime)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Generating...
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  Generate Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}