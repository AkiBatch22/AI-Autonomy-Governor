"use client";

import { useState } from "react";

import { simulatePolicy } from "@/lib/api";

import type {
  SimulationResult,
} from "@/types/agent";


interface PolicySimulatorProps {
  agentId: number;
}


function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}


function formatCurrency(value: number) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}


export default function PolicySimulator({
  agentId,
}: PolicySimulatorProps) {

  const [
    confidenceThreshold,
    setConfidenceThreshold,
  ] = useState(0.88);

  const [
    maxTransactionValue,
    setMaxTransactionValue,
  ] = useState(100000);

  const [
    maxErrorRate,
    setMaxErrorRate,
  ] = useState(0.005);

  const [
    result,
    setResult,
  ] = useState<SimulationResult | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);


  async function runSimulation() {

    setLoading(true);
    setError(null);

    try {

      const simulation =
        await simulatePolicy(
          agentId,
          {
            confidence_threshold:
              confidenceThreshold,

            max_transaction_value:
              maxTransactionValue,

            max_error_rate:
              maxErrorRate,
          }
        );

      setResult(simulation);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Simulation failed."
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <div className="space-y-8">

      {/* INPUT PANEL */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Policy Simulator
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Backtest a proposed autonomy policy
            against historical AI executions.
          </p>
        </div>


        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          {/* CONFIDENCE */}

          <div>

            <div className="flex items-center justify-between">

              <label className="text-sm font-medium text-gray-700">
                Minimum confidence
              </label>

              <span className="font-semibold text-gray-900">
                {(confidenceThreshold * 100).toFixed(0)}%
              </span>

            </div>

            <input
              type="range"
              min="0.80"
              max="0.99"
              step="0.01"
              value={confidenceThreshold}
              onChange={(event) =>
                setConfidenceThreshold(
                  Number(event.target.value)
                )
              }
              className="mt-4 w-full"
            />

            <p className="mt-2 text-xs text-gray-500">
              AI must meet this confidence level
              before acting autonomously.
            </p>

          </div>


          {/* AMOUNT */}

          <div>

            <div className="flex items-center justify-between">

              <label className="text-sm font-medium text-gray-700">
                Maximum transaction
              </label>

              <span className="font-semibold text-gray-900">
                {formatCurrency(
                  maxTransactionValue
                )}
              </span>

            </div>

            <input
              type="range"
              min="25000"
              max="200000"
              step="25000"
              value={maxTransactionValue}
              onChange={(event) =>
                setMaxTransactionValue(
                  Number(event.target.value)
                )
              }
              className="mt-4 w-full"
            />

            <p className="mt-2 text-xs text-gray-500">
              Transactions above this value remain
              human reviewed.
            </p>

          </div>


          {/* ERROR */}

          <div>

            <div className="flex items-center justify-between">

              <label className="text-sm font-medium text-gray-700">
                Maximum error rate
              </label>

              <span className="font-semibold text-gray-900">
                {formatPercent(maxErrorRate)}
              </span>

            </div>

            <input
              type="range"
              min="0.001"
              max="0.02"
              step="0.001"
              value={maxErrorRate}
              onChange={(event) =>
                setMaxErrorRate(
                  Number(event.target.value)
                )
              }
              className="mt-4 w-full"
            />

            <p className="mt-2 text-xs text-gray-500">
              Proposed policy must remain below
              this risk tolerance.
            </p>

          </div>

        </div>


        <div className="mt-8 flex items-center gap-4">

          <button
            onClick={runSimulation}
            disabled={loading}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading
              ? "Running backtest..."
              : "Run Backtest"}

          </button>

          {result?.simulation_id && (
            <p className="text-sm text-gray-500">
              Simulation #{result.simulation_id}
            </p>
          )}

        </div>


        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

      </section>


      {/* RESULTS */}

      {result && (

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-xl font-semibold text-gray-900">
                Backtest Results
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current policy compared with your
                proposed autonomy policy.
              </p>

            </div>


            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                result.risk.status === "pass"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >

              {result.risk.status === "pass"
                ? "✓ SAFE"
                : "✕ EXCEEDS RISK"}

            </div>

          </div>


          {/* CURRENT VS PROPOSED */}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* CURRENT */}

            <div className="rounded-xl bg-gray-50 p-6">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current Policy
              </p>

              <div className="mt-6 space-y-5">

                <ResultRow
                  label="Autonomy"
                  value={formatPercent(
                    result.current.autonomy_rate
                  )}
                />

                <ResultRow
                  label="Human reviews"
                  value={
                    result.current.human_reviews
                      .toLocaleString()
                  }
                />

                <ResultRow
                  label="Accuracy"
                  value={formatPercent(
                    result.current.accuracy
                  )}
                />

                <ResultRow
                  label="Error rate"
                  value={formatPercent(
                    result.current.error_rate
                  )}
                />

              </div>

            </div>


            {/* PROPOSED */}

            <div className="rounded-xl border-2 border-gray-900 p-6">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Proposed Policy
              </p>

              <div className="mt-6 space-y-5">

                <ResultRow
                  label="Autonomy"
                  value={formatPercent(
                    result.proposed.autonomy_rate
                  )}
                />

                <ResultRow
                  label="Human reviews"
                  value={
                    result.proposed.human_reviews
                      .toLocaleString()
                  }
                />

                <ResultRow
                  label="Accuracy"
                  value={formatPercent(
                    result.proposed.accuracy
                  )}
                />

                <ResultRow
                  label="Error rate"
                  value={formatPercent(
                    result.proposed.error_rate
                  )}
                />

              </div>

            </div>

          </div>


          {/* IMPACT */}

          <div className="mt-8 border-t border-gray-200 pt-6">

            <p className="text-sm font-semibold text-gray-900">
              Expected historical impact
            </p>


            <div className="mt-5 grid gap-5 md:grid-cols-3">

              <ImpactCard
                label="Autonomy change"
                value={`${
                  result.impact.autonomy_change >= 0
                    ? "+"
                    : ""
                }${(
                  result.impact.autonomy_change *
                  100
                ).toFixed(2)} pts`}
              />

              <ImpactCard
                label="Human reviews saved"
                value={
                  result.impact.human_reviews_saved
                    .toLocaleString()
                }
              />

              <ImpactCard
                label="Allowed error rate"
                value={formatPercent(
                  result.risk
                    .maximum_allowed_error_rate
                )}
              />

            </div>

          </div>

        </section>

      )}

    </div>
  );
}


function ResultRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-lg font-semibold text-gray-900">
        {value}
      </span>

    </div>
  );
}


function ImpactCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="rounded-lg bg-gray-50 p-4">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {value}
      </p>

    </div>
  );
}