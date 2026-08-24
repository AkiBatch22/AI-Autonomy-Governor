"use client";

import { useState } from "react";

import {
  recommendPolicy,
  savePolicy,
} from "@/lib/api";

import type {
  RecommendationResult,
} from "@/types/agent";


interface GovernorRecommendationProps {
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


export default function GovernorRecommendation({
  agentId,
}: GovernorRecommendationProps) {

  const [
    maxErrorRate,
    setMaxErrorRate,
  ] = useState(0.005);

  const [
    result,
    setResult,
  ] = useState<RecommendationResult | null>(
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

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    savedPolicyId,
    setSavedPolicyId,
  ] = useState<number | null>(null);


  async function generateRecommendation() {

    setLoading(true);
    setError(null);

    // If the user generates a new recommendation,
    // allow them to save the new policy.
    setSavedPolicyId(null);

    try {

      const recommendation =
        await recommendPolicy(
          agentId,
          {
            max_error_rate: maxErrorRate,
            minimum_sample_size: 100,
          }
        );

      setResult(recommendation);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Recommendation failed."
      );

    } finally {

      setLoading(false);

    }
  }


  async function saveRecommendedPolicy() {

    if (!result) {
      return;
    }

    setSaving(true);
    setError(null);

    try {

      const policy = await savePolicy(
        agentId,
        {
          name: "Governor Recommended Policy",

          minimum_confidence:
            result.recommendation
              .confidence_threshold,

          maximum_transaction_value:
            result.recommendation
              .max_transaction_value,

          maximum_error_rate:
            maxErrorRate,
        }
      );

      setSavedPolicyId(policy.id);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save policy."
      );

    } finally {

      setSaving(false);

    }
  }


  return (
    <div className="space-y-8">

      {/* GOVERNOR INPUT */}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          Ask Governor
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Find the highest-autonomy policy that
          stays within your acceptable risk.
        </p>


        <div className="mt-8 max-w-md">

          <div className="flex items-center justify-between">

            <label className="text-sm font-medium text-gray-700">
              Maximum acceptable error rate
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
            Governor will reject policies whose
            historical error rate exceeds this value.
          </p>

        </div>


        <button
          onClick={generateRecommendation}
          disabled={loading}
          className="mt-7 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >

          {loading
            ? "Testing policies..."
            : "Generate Recommendation"}

        </button>


        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

      </section>


      {/* GOVERNOR RESULT */}

      {result && (

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm font-medium text-gray-500">
                GOVERNOR RECOMMENDATION
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                Increase safe autonomy
              </h2>

            </div>


            <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              ✓ PASSES RISK POLICY
            </div>

          </div>


          {/* RECOMMENDED POLICY METRICS */}

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <RecommendationMetric
              label="Confidence threshold"
              value={
                formatPercent(
                  result.recommendation
                    .confidence_threshold
                )
              }
            />


            <RecommendationMetric
              label="Maximum transaction"
              value={
                formatCurrency(
                  result.recommendation
                    .max_transaction_value
                )
              }
            />


            <RecommendationMetric
              label="Safe autonomy"
              value={
                formatPercent(
                  result.recommendation
                    .autonomy_rate
                )
              }
            />


            <RecommendationMetric
              label="Historical error"
              value={
                formatPercent(
                  result.recommendation
                    .error_rate
                )
              }
            />

          </div>


          {/* EXPECTED IMPACT */}

          <div className="mt-8 rounded-xl bg-gray-50 p-6">

            <h3 className="font-semibold text-gray-900">
              Expected impact
            </h3>


            <div className="mt-5 grid gap-6 md:grid-cols-3">

              <div>

                <p className="text-sm text-gray-500">
                  Additional autonomy
                </p>

                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {result.recommendation
                    .autonomy_change >= 0
                    ? "+"
                    : ""}

                  {(
                    result.recommendation
                      .autonomy_change * 100
                  ).toFixed(2)}

                  {" pts"}
                </p>

              </div>


              <div>

                <p className="text-sm text-gray-500">
                  Human reviews saved
                </p>

                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {result.recommendation
                    .human_reviews_saved
                    .toLocaleString()}
                </p>

              </div>


              <div>

                <p className="text-sm text-gray-500">
                  Policies evaluated
                </p>

                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {result.total_policies_tested}
                </p>

              </div>

            </div>

          </div>


          {/* SAFE POLICY COUNT */}

          <div className="mt-6 text-sm text-gray-500">

            Governor found{" "}

            <span className="font-medium text-gray-900">
              {result.safe_policies_tested}
            </span>

            {" "}policies that satisfied your
            configured risk tolerance.

          </div>


          {/* SAVE POLICY */}

          <div className="mt-8 border-t border-gray-200 pt-6">

            <button
              onClick={saveRecommendedPolicy}
              disabled={
                saving ||
                savedPolicyId !== null
              }
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving
                ? "Saving Policy..."
                : savedPolicyId
                  ? "Policy Saved ✓"
                  : "Save Recommended Policy"}

            </button>


            {savedPolicyId && (

              <div className="mt-4 rounded-lg bg-green-50 p-4">

                <p className="text-sm font-medium text-green-700">
                  Policy saved successfully.
                </p>

                <p className="mt-1 text-sm text-green-600">
                  Policy ID: #{savedPolicyId}
                </p>

              </div>

            )}

          </div>

        </section>

      )}

    </div>
  );
}


function RecommendationMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="rounded-xl border border-gray-200 p-5">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-gray-900">
        {value}
      </p>

    </div>
  );
}