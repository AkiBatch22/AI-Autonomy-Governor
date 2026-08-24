import {
    ShieldCheck,
    Sparkles,
  } from "lucide-react";
  
  import GovernorRecommendation from "@/components/GovernorRecommendation";
  import AutonomyFrontier from "@/components/AutonomyFrontier";
  
  import {
    getAgents,
    getPolicies,
    getTopPolicies,
  } from "@/lib/api";
  
  import type {
    RecommendedPolicy,
  } from "@/types/agent";
  
  
  interface RecommendationsPageProps {
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
  
  
  export default async function RecommendationsPage({
    searchParams,
  }: RecommendationsPageProps) {
  
    const params =
      await searchParams;
  
    const agents =
      await getAgents();
  
  
    if (agents.length === 0) {
  
      return (
        <main className="min-h-screen bg-gray-50">
  
          <div className="mx-auto max-w-7xl px-8 py-10">
  
            <h1 className="text-3xl font-semibold text-gray-900">
              Governor Recommendations
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
      Load the current active policy so
      Governor recommendations can be shown
      in the context of existing governance.
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
      Load safe candidate policies for the
      autonomy-vs-risk frontier.
  
      The interactive Governor component
      still lets the user choose its own
      acceptable error rate.
    */
  
    const defaultRiskLimit =
      0.005;
  
  
    let frontierPolicies:
      RecommendedPolicy[] = [];
  
  
    try {
  
      frontierPolicies =
        await getTopPolicies(
          agent.id,
          defaultRiskLimit,
          20
        );
  
    } catch {
  
      frontierPolicies = [];
  
    }
  
  
    return (
      <main className="min-h-screen bg-gray-50">
  
        <div className="mx-auto max-w-7xl px-8 py-10">
  
          {/* =====================================================
              PAGE HEADER
          ===================================================== */}
  
          <div>
  
            <div className="flex flex-wrap items-center gap-2">
  
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
  
                <Sparkles size={13} />
  
                Governor
  
              </span>
  
  
              {activePolicy && (
  
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase text-green-700">
  
                  <ShieldCheck size={13} />
  
                  Governed
  
                </span>
  
              )}
  
            </div>
  
  
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
              Autonomy Recommendations
            </h1>
  
  
            <p className="mt-2 text-gray-500">
              {agent.name}
              {" · "}
              {agent.department}
              {" · "}
              {agent.workflow}
            </p>
  
  
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
              Let Governor search historical performance
              and identify the highest safe autonomy level
              that remains within your configured risk
              tolerance.
            </p>
  
          </div>
  
  
          {/* =====================================================
              CURRENT GOVERNANCE CONTEXT
          ===================================================== */}
  
          {activePolicy && (
  
            <section className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
  
                <div>
  
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Current Governing Policy
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
  
                <PolicyMetric
                  label="Minimum Confidence"
                  value={
                    formatPercent(
                      activePolicy.minimum_confidence
                    )
                  }
                />
  
  
                <PolicyMetric
                  label="Maximum Transaction"
                  value={
                    formatCurrency(
                      activePolicy
                        .maximum_transaction_value
                    )
                  }
                />
  
  
                <PolicyMetric
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
              GOVERNOR WORKSPACE
          ===================================================== */}
  
          <section className="mt-8">
  
            <div className="mb-4">
  
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Recommendation Engine
              </p>
  
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                Find the Best Safe Policy
              </h2>
  
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Choose your maximum acceptable error
                rate and let Governor evaluate the
                available policy space.
              </p>
  
            </div>
  
  
            <GovernorRecommendation
              agentId={agent.id}
            />
  
          </section>
  
  
          {/* =====================================================
              POLICY FRONTIER
          ===================================================== */}
  
          <section className="mt-8">
  
            <div className="mb-4">
  
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Decision Intelligence
              </p>
  
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                Policy Trade-off Analysis
              </h2>
  
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Compare candidate policies across
                autonomy and historical decision risk.
              </p>
  
            </div>
  
  
            <AutonomyFrontier
              policies={frontierPolicies}
              riskLimit={defaultRiskLimit}
            />
  
          </section>
  
        </div>
  
      </main>
    );
  }
  
  
  function PolicyMetric({
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