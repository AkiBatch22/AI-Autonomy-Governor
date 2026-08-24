import {
    FileClock,
    ShieldCheck,
  } from "lucide-react";
  
  import AuditTrail from "@/components/AuditTrail";
  
  import {
    getAgents,
    getPolicies,
    getSimulations,
  } from "@/lib/api";
  
  
  interface AuditPageProps {
    searchParams: Promise<{
      agentId?: string;
    }>;
  }
  
  
  export default async function AuditPage({
    searchParams,
  }: AuditPageProps) {
  
    const params =
      await searchParams;
  
    const agents =
      await getAgents();
  
  
    if (agents.length === 0) {
  
      return (
        <main className="min-h-screen bg-gray-50">
  
          <div className="mx-auto max-w-7xl px-8 py-10">
  
            <h1 className="text-3xl font-semibold text-gray-900">
              Governance Audit Trail
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
          agent.id ===
          requestedAgentId
      ) ?? defaultAgent;
  
  
    const [
      policies,
      simulations,
    ] = await Promise.all([
      getPolicies(agent.id),
      getSimulations(agent.id),
    ]);
  
  
    const activePolicy =
      policies.find(
        (policy) =>
          policy.status.toLowerCase() ===
          "active"
      );
  
  
    return (
      <main className="min-h-screen bg-gray-50">
  
        <div className="mx-auto max-w-7xl px-8 py-10">
  
          {/* =====================================================
              PAGE HEADER
          ===================================================== */}
  
          <div>
  
            <div className="flex flex-wrap items-center gap-2">
  
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
  
                <FileClock size={13} />
  
                Governance Record
  
              </span>
  
  
              {activePolicy && (
  
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase text-green-700">
  
                  <ShieldCheck size={13} />
  
                  Active Governance
  
                </span>
  
              )}
  
            </div>
  
  
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
              Governance Audit Trail
            </h1>
  
  
            <p className="mt-2 text-gray-500">
              {agent.name}
              {" · "}
              {agent.department}
              {" · "}
              {agent.workflow}
            </p>
  
  
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
              Review saved governance policies,
              historical backtests, activation status,
              and the decision evidence used to manage
              this AI employee&apos;s autonomy.
            </p>
  
          </div>
  
  
          {/* =====================================================
              CURRENT GOVERNANCE SUMMARY
          ===================================================== */}
  
          <section className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
  
              <div>
  
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Current Governance State
                </p>
  
  
                <h2 className="mt-1 text-lg font-semibold text-gray-900">
  
                  {activePolicy
                    ? activePolicy.name
                    : "No active governing policy"}
  
                </h2>
  
              </div>
  
  
              {activePolicy ? (
  
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold uppercase text-green-700">
  
                  <ShieldCheck size={14} />
  
                  Active
  
                </span>
  
              ) : (
  
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold uppercase text-amber-700">
                  Ungoverned
                </span>
  
              )}
  
            </div>
  
  
            <div className="grid gap-0 divide-y divide-gray-100 md:grid-cols-3 md:divide-x md:divide-y-0">
  
              <GovernanceMetric
                label="Saved Policies"
                value={
                  policies.length
                    .toLocaleString()
                }
              />
  
  
              <GovernanceMetric
                label="Recorded Backtests"
                value={
                  simulations.length
                    .toLocaleString()
                }
              />
  
  
              <GovernanceMetric
                label="Safe Backtests"
                value={
                  simulations
                    .filter(
                      (simulation) =>
                        simulation.risk_status
                          .toLowerCase() ===
                        "pass"
                    )
                    .length
                    .toLocaleString()
                }
              />
  
            </div>
  
          </section>
  
  
          {/* =====================================================
              AUDIT LOG
          ===================================================== */}
  
          <section className="mt-8">
  
            <div className="mb-4">
  
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Governance History
              </p>
  
  
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                Policy & Simulation Records
              </h2>
  
  
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Every saved policy and historical
                simulation is retained here to provide
                a traceable record of autonomy decisions.
              </p>
  
            </div>
  
  
            <AuditTrail
              agentId={agent.id}
              policies={policies}
              simulations={simulations}
            />
  
          </section>
  
        </div>
  
      </main>
    );
  }
  
  
  function GovernanceMetric({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
  
    return (
      <div className="px-6 py-5">
  
        <p className="text-sm text-gray-500">
          {label}
        </p>
  
        <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
          {value}
        </p>
  
      </div>
    );
  }