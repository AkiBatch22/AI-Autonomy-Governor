"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  RecommendedPolicy,
} from "@/types/agent";


interface AutonomyFrontierProps {
  policies: RecommendedPolicy[];
  riskLimit: number;
}


function formatPercent(
  value: number
) {
  return `${(value * 100).toFixed(2)}%`;
}


function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}


export default function AutonomyFrontier({
  policies,
  riskLimit,
}: AutonomyFrontierProps) {

  const data = policies.map(
    (policy) => ({
      autonomy:
        Number(
          (
            policy.autonomy_rate *
            100
          ).toFixed(2)
        ),

      error:
        Number(
          (
            policy.error_rate *
            100
          ).toFixed(2)
        ),

      confidence:
        policy.confidence_threshold,

      transaction:
        policy.max_transaction_value,

      reviewsSaved:
        policy.human_reviews_saved,
    })
  );


  if (data.length === 0) {

    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-900">
          Autonomy vs Risk Frontier
        </h2>

        <p className="mt-4 text-sm text-gray-500">
          No safe policy candidates are available
          for this risk tolerance.
        </p>

      </section>
    );
  }


  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

      <div>

        <p className="text-sm font-medium text-gray-500">
          POLICY FRONTIER
        </p>

        <h2 className="mt-1 text-xl font-semibold text-gray-900">
          Autonomy vs Risk
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Compare safe policy candidates and see
          how additional autonomy affects historical
          decision risk.
        </p>

      </div>


      <div className="mt-8 h-96">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <ScatterChart
            margin={{
              top: 20,
              right: 30,
              bottom: 20,
              left: 10,
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
            />


            <XAxis
              type="number"
              dataKey="autonomy"
              name="Autonomy"
              unit="%"
              domain={[
                "dataMin - 2",
                "dataMax + 2",
              ]}
              tick={{
                fontSize: 12,
              }}
              label={{
                value: "Safe Autonomy Rate",
                position: "insideBottom",
                offset: -10,
              }}
            />


            <YAxis
              type="number"
              dataKey="error"
              name="Error Rate"
              unit="%"
              domain={[
                0,
                Math.max(
                  riskLimit * 100 * 1.25,
                  1
                ),
              ]}
              tick={{
                fontSize: 12,
              }}
              label={{
                value: "Historical Error Rate",
                angle: -90,
                position: "insideLeft",
              }}
            />


            <ReferenceLine
              y={riskLimit * 100}
              stroke="#dc2626"
              strokeDasharray="6 6"
              label={{
                value: `Risk limit: ${formatPercent(
                  riskLimit
                )}`,
                position: "insideTopRight",
                fill: "#dc2626",
                fontSize: 12,
              }}
            />


            <Tooltip
              cursor={{
                strokeDasharray: "3 3",
              }}
              content={
                <FrontierTooltip />
              }
            />


            <Scatter
              name="Safe Policies"
              data={data}
              fill="#111827"
            />

          </ScatterChart>

        </ResponsiveContainer>

      </div>


      <div className="mt-4 rounded-lg bg-gray-50 p-4">

        <p className="text-sm text-gray-600">

          Each point represents a policy that
          satisfied the configured risk tolerance.
          Policies farther to the right provide
          greater autonomy, while lower points
          represent lower historical error.

        </p>

      </div>

    </section>
  );
}


function FrontierTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      autonomy: number;
      error: number;
      confidence: number;
      transaction: number;
      reviewsSaved: number;
    };
  }>;
}) {

  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }


  const policy =
    payload[0].payload;


  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">

      <p className="text-sm font-semibold text-gray-900">
        Policy Candidate
      </p>


      <div className="mt-3 space-y-2 text-sm">

        <TooltipRow
          label="Autonomy"
          value={`${policy.autonomy.toFixed(2)}%`}
        />

        <TooltipRow
          label="Error"
          value={`${policy.error.toFixed(2)}%`}
        />

        <TooltipRow
          label="Confidence"
          value={formatPercent(
            policy.confidence
          )}
        />

        <TooltipRow
          label="Max transaction"
          value={formatCurrency(
            policy.transaction
          )}
        />

        <TooltipRow
          label="Reviews saved"
          value={
            policy.reviewsSaved
              .toLocaleString()
          }
        />

      </div>

    </div>
  );
}


function TooltipRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="flex min-w-52 justify-between gap-6">

      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-medium text-gray-900">
        {value}
      </span>

    </div>
  );
}