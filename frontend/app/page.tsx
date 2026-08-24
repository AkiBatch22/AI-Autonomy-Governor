import Link from "next/link";

import {
  ArrowRight,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";

import PolicySimulator from "@/components/PolicySimulator";

import {
  getAgents,
  getAgentMetrics,
  getPolicies,
} from "@/lib/api";


interface SimulatorPageProps {
  searchParams: Promise<{
    agentId?: string;
  }>;
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


export default async function SimulatorPage({
  searchParams,
}: SimulatorPageProps) {

  const params =
    await searchParams;

  const agents =
    await getAgents();


  if (agents.length === 0) {

    return (
      <main className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-7xl px-8 py-10">

          <h1 className="text-3xl font-semibold text-gray-900">
            Policy Simulator
          </h1>

          <p className="mt-2 text-gray-500">
            No AI employees are currently available.
          </p>

        </div>

      </main>
    );
  }


  const requestedAgentId =
    Number(params.agentId);


  const defaultAgent =
    agents.find(
      (agent) =>
        agent.name ===
        "Accounts Payable AI"
    ) ?? agents[0];


  const agent =
    agents.find(
      (agent) =>
        agent.id === requestedAgentId
    ) ?? defaultAgent;


  /*
    Load the currently active policy
    so the simulator has governance
    context.
  */

  const policies =
    await getPolicies(
      agent.id
    );


  const activePolicy =
    policies.find(
      (policy) =>
        policy.status.toLowerCase() ===
        "active"
    );


  /*
    Check whether this employee has
    historical executions available
    for backtesting.
  */

  try {

    await getAgentMetrics(
      agent.id
    );

  } catch {

    return (
      <main className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-7xl px-8 py-10">

          {/* HEADER */}

          <div>

            <div className="flex items-center gap-2">

              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Policy Simulator
              </span>

            </div>


            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
              {agent.name}
            </h1>


            <p className="mt-2 text-gray-500">
              {agent.department}
              {" · "}
              {agent.workflow}
            </p>

          </div>


          {/* EMPTY STATE */}

          <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">

              <FlaskConical
                size={22}
                className="text-gray-700"
              />

            </div>


            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              Backtesting unavailable
            </h2>


            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              This AI employee does not yet have
              sufficient historical execution data
              to simulate autonomy policies.
            </p>

          </section>

        </div>

      </main>
    );
  }


  const agentQuery =
    `?agentId=${agent.id}`;


  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-7xl px-8 py-10">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Policy Simulator
              </span>


              {activePolicy && (

                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase text-green-700">

                  <ShieldCheck size={13} />

                  Active Policy Loaded

                </span>

              )}

            </div>


            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
              Backtest Autonomy Policy
            </h1>


            <p className="mt-2 text-gray-500">
              {agent.name}
              {" · "}
              {agent.department}
              {" · "}
              {agent.workflow}
            </p>


            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
              Replay historical AI executions against
              proposed governance rules before changing
              production autonomy.
            </p>

          </div>


          {/* PRIMARY ACTION */}

          <Link
            href={`/recommendations${agentQuery}`}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 lg:self-auto"
          >

            Ask Governor

            <ArrowRight size={16} />

          </Link>

        </div>


        {/* =====================================================
            ACTIVE POLICY CONTEXT
        ===================================================== */}

        {activePolicy && (

          <section className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Current Baseline
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                  {activePolicy.name}
                </h2>

              </div>


              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold uppercase text-green-700">

                <ShieldCheck size={14} />

                Active

              </span>

            </div>


            <div className="grid md:grid-cols-3">

              <BaselineMetric
                label="Minimum Confidence"
                value={
                  formatPercent(
                    activePolicy.minimum_confidence
                  )
                }
              />


              <BaselineMetric
                label="Maximum Transaction"
                value={
                  formatCurrency(
                    activePolicy.maximum_transaction_value
                  )
                }
              />


              <BaselineMetric
                label="Maximum Error Rate"
                value={
                  formatPercent(
                    activePolicy.maximum_error_rate
                  )
                }
              />

            </div>

          </section>

        )}


        {/* =====================================================
            SIMULATION WORKSPACE
        ===================================================== */}

        <div className="mt-8">

          <div className="mb-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Backtesting Workspace
            </p>

            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              Proposed Policy
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Adjust governance thresholds and compare
              the proposed policy against historical
              performance.
            </p>

          </div>


          <PolicySimulator
            agentId={agent.id}
          />

        </div>

      </div>

    </main>
  );
}


function BaselineMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="border-t border-gray-100 px-6 py-5 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-gray-900">
        {value}
      </p>

    </div>
  );
}