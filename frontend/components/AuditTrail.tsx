"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { activatePolicy } from "@/lib/api";

import type {
  Policy,
  SimulationHistory,
} from "@/types/agent";


interface AuditTrailProps {
  agentId: number;
  policies: Policy[];
  simulations: SimulationHistory[];
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


function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(value));
}


export default function AuditTrail({
  agentId,
  policies,
  simulations,
}: AuditTrailProps) {

  const router = useRouter();

  const [
    activatingPolicyId,
    setActivatingPolicyId,
  ] = useState<number | null>(null);

  const [
    activationError,
    setActivationError,
  ] = useState<string | null>(null);


  async function handleActivatePolicy(
    policyId: number
  ) {

    setActivatingPolicyId(policyId);
    setActivationError(null);

    try {

      await activatePolicy(
        agentId,
        policyId
      );

      /*
       Refresh the Server Component.
       This reloads policies from PostgreSQL
       so the new ACTIVE / RETIRED status
       appears immediately.
      */
      router.refresh();

    } catch (err) {

      setActivationError(
        err instanceof Error
          ? err.message
          : "Failed to activate policy."
      );

    } finally {

      setActivatingPolicyId(null);

    }
  }


  return (
    <div className="space-y-8">
      
      {/* ACTIVATION ERROR */}

      {activationError && (

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">

          <p className="text-sm font-medium text-red-700">
            {activationError}
          </p>

        </div>

      )}


      {/* POLICY HISTORY */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 p-6">

          <h2 className="text-xl font-semibold text-gray-900">
            Policy History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Governance policies saved for this AI employee.
          </p>

        </div>


        {policies.length === 0 ? (

          <div className="p-6 text-sm text-gray-500">
            No policies have been saved yet.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>

                  <th className="px-6 py-4">
                    Policy
                  </th>

                  <th className="px-6 py-4">
                    Confidence
                  </th>

                  <th className="px-6 py-4">
                    Max Transaction
                  </th>

                  <th className="px-6 py-4">
                    Risk Limit
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Created
                  </th>

                  <th className="px-6 py-4">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-gray-200">

                {policies.map((policy) => {

                  const status =
                    policy.status.toLowerCase();

                  const isActive =
                    status === "active";

                  const isActivating =
                    activatingPolicyId ===
                    policy.id;


                  return (

                    <tr
                      key={policy.id}
                      className="hover:bg-gray-50"
                    >

                      {/* POLICY */}

                      <td className="px-6 py-4">

                        <p className="font-medium text-gray-900">
                          {policy.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Policy #{policy.id}
                        </p>

                      </td>


                      {/* CONFIDENCE */}

                      <td className="px-6 py-4 text-gray-700">

                        {formatPercent(
                          policy.minimum_confidence
                        )}

                      </td>


                      {/* MAX TRANSACTION */}

                      <td className="px-6 py-4 text-gray-700">

                        {formatCurrency(
                          policy.maximum_transaction_value
                        )}

                      </td>


                      {/* RISK LIMIT */}

                      <td className="px-6 py-4 text-gray-700">

                        {formatPercent(
                          policy.maximum_error_rate
                        )}

                      </td>


                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <PolicyStatusBadge
                          status={policy.status}
                        />

                      </td>


                      {/* CREATED */}

                      <td className="px-6 py-4 text-gray-500">

                        {formatDate(
                          policy.created_at
                        )}

                      </td>


                      {/* ACTION */}

                      <td className="px-6 py-4">

                        {isActive ? (

                          <span className="text-sm font-medium text-green-700">
                            Governing Policy
                          </span>

                        ) : (

                          <button
                            onClick={() =>
                              handleActivatePolicy(
                                policy.id
                              )
                            }
                            disabled={
                              activatingPolicyId !== null
                            }
                            className="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >

                            {isActivating
                              ? "Activating..."
                              : "Activate Policy"}

                          </button>

                        )}

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* SIMULATION HISTORY */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 p-6">

          <h2 className="text-xl font-semibold text-gray-900">
            Simulation Audit Log
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Historical policy backtests and their governance outcomes.
          </p>

        </div>


        {simulations.length === 0 ? (

          <div className="p-6 text-sm text-gray-500">
            No simulations have been recorded yet.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                <tr>

                  <th className="px-6 py-4">
                    Simulation
                  </th>

                  <th className="px-6 py-4">
                    Threshold
                  </th>

                  <th className="px-6 py-4">
                    Transaction Limit
                  </th>

                  <th className="px-6 py-4">
                    Autonomy
                  </th>

                  <th className="px-6 py-4">
                    Error
                  </th>

                  <th className="px-6 py-4">
                    Reviews Saved
                  </th>

                  <th className="px-6 py-4">
                    Result
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-gray-200">

                {simulations.map(
                  (simulation) => {

                    const passed =
                      simulation.risk_status
                        .toLowerCase() ===
                      "pass";


                    return (

                      <tr
                        key={simulation.id}
                        className="hover:bg-gray-50"
                      >

                        {/* SIMULATION */}

                        <td className="px-6 py-4">

                          <p className="font-medium text-gray-900">
                            #{simulation.id}
                          </p>


                          {simulation.policy_id && (

                            <p className="mt-1 text-xs text-gray-500">
                              Policy #
                              {simulation.policy_id}
                            </p>

                          )}

                        </td>


                        {/* THRESHOLD */}

                        <td className="px-6 py-4">

                          {formatPercent(
                            simulation.confidence_threshold
                          )}

                        </td>


                        {/* TRANSACTION LIMIT */}

                        <td className="px-6 py-4">

                          {formatCurrency(
                            simulation.max_transaction_value
                          )}

                        </td>


                        {/* AUTONOMY */}

                        <td className="px-6 py-4">

                          <p className="font-medium text-gray-900">

                            {formatPercent(
                              simulation.proposed_autonomy_rate
                            )}

                          </p>


                          <p className="mt-1 text-xs text-gray-500">

                            {simulation.autonomy_change >=
                            0
                              ? "+"
                              : ""}

                            {(
                              simulation.autonomy_change *
                              100
                            ).toFixed(2)}

                            {" pts"}

                          </p>

                        </td>


                        {/* ERROR */}

                        <td className="px-6 py-4">

                          {formatPercent(
                            simulation.proposed_error_rate
                          )}

                        </td>


                        {/* REVIEWS SAVED */}

                        <td className="px-6 py-4">

                          {simulation.human_reviews_saved
                            .toLocaleString()}

                        </td>


                        {/* RESULT */}

                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              passed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >

                            {passed
                              ? "PASS"
                              : "FAIL"}

                          </span>

                        </td>


                        {/* DATE */}

                        <td className="px-6 py-4 text-gray-500">

                          {formatDate(
                            simulation.created_at
                          )}

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}


/* =========================================================
   POLICY STATUS BADGE
========================================================= */


function PolicyStatusBadge({
  status,
}: {
  status: string;
}) {

  const normalizedStatus =
    status.toLowerCase();


  if (normalizedStatus === "active") {

    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase text-green-700">
        Active
      </span>
    );

  }


  if (normalizedStatus === "retired") {

    return (
      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
        Retired
      </span>
    );

  }


  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
      Saved
    </span>
  );
}
