"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Activity,
  Gauge,
  History,
  LayoutDashboard,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  ChangeEvent,
} from "react";

import type {
  Agent,
} from "@/types/agent";


interface SidebarProps {
  agents: Agent[];
}


const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },

  {
    name: "Policy Simulator",
    href: "/simulator",
    icon: Gauge,
  },

  {
    name: "Recommendations",
    href: "/recommendations",
    icon: Sparkles,
  },

  {
    name: "Audit Trail",
    href: "/audit",
    icon: History,
  },
];


export default function Sidebar({
  agents,
}: SidebarProps) {

  const pathname =
    usePathname();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);


  const requestedAgentId =
    Number(
      searchParams.get("agentId")
    );


  const defaultAgent =
    agents.find(
      (agent) =>
        agent.name ===
        "Accounts Payable AI"
    ) ?? agents[0];


  const selectedAgent =
    agents.find(
      (agent) =>
        agent.id === requestedAgentId
    ) ?? defaultAgent;


  const selectedAgentId =
    selectedAgent?.id;


  function handleAgentChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {

    const newAgentId =
      event.target.value;


    const params =
      new URLSearchParams(
        searchParams.toString()
      );


    params.set(
      "agentId",
      newAgentId
    );


    router.push(
      `${pathname}?${params.toString()}`
    );


    setMobileOpen(false);
  }


  function buildNavigationHref(
    href: string
  ) {

    if (!selectedAgentId) {
      return href;
    }


    return `${href}?agentId=${selectedAgentId}`;
  }


  function isActive(
    href: string
  ) {

    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(
      href
    );
  }


  return (
    <>

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-5 lg:hidden">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white">

            <Activity size={18} />

          </div>


          <div>

            <p className="text-sm font-semibold text-gray-900">
              Autonomy Governor
            </p>

            {selectedAgent && (

              <p className="max-w-44 truncate text-xs text-gray-500">
                {selectedAgent.name}
              </p>

            )}

          </div>

        </div>


        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              !mobileOpen
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50"
          aria-label="Open navigation"
        >

          {mobileOpen
            ? <X size={20} />
            : <Menu size={20} />}

        </button>

      </header>


      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileOpen && (

        <div className="fixed inset-0 top-16 z-40 bg-black/20 lg:hidden">

          <div className="border-b border-gray-200 bg-white px-5 py-6 shadow-lg">

            {/* NAVIGATION */}

            <nav className="space-y-1">

              {navigation.map(
                (item) => {

                  const Icon =
                    item.icon;

                  const active =
                    isActive(
                      item.href
                    );


                  return (

                    <Link
                      key={item.href}
                      href={
                        buildNavigationHref(
                          item.href
                        )
                      }
                      onClick={() =>
                        setMobileOpen(
                          false
                        )
                      }
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >

                      <Icon size={18} />

                      {item.name}

                    </Link>

                  );

                }
              )}

            </nav>


            {/* EMPLOYEE SELECTOR */}

            <div className="mt-6 border-t border-gray-200 pt-6">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                AI Employee
              </p>


              {agents.length > 0 ? (

                <>

                  <select
                    value={
                      selectedAgentId ??
                      ""
                    }
                    onChange={
                      handleAgentChange
                    }
                    className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-900 outline-none focus:border-gray-500"
                  >

                    {agents.map(
                      (agent) => (

                        <option
                          key={agent.id}
                          value={agent.id}
                        >
                          {agent.name}
                        </option>

                      )
                    )}

                  </select>


                  {selectedAgent && (

                    <div className="mt-3 rounded-lg bg-gray-50 p-3">

                      <p className="text-sm font-medium text-gray-900">
                        {selectedAgent.department}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {selectedAgent.workflow}
                      </p>

                    </div>

                  )}

                </>

              ) : (

                <p className="mt-3 text-sm text-gray-500">
                  No AI employees found.
                </p>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="hidden min-h-screen w-64 shrink-0 border-r border-gray-200 bg-white lg:block">

        <div className="sticky top-0 p-6">

          {/* PRODUCT */}

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">

              <Activity size={20} />

            </div>


            <div>

              <p className="text-sm font-semibold text-gray-900">
                Autonomy Governor
              </p>

              <p className="text-xs text-gray-500">
                AI Governance
              </p>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="mt-10 space-y-1">

            {navigation.map(
              (item) => {

                const Icon =
                  item.icon;

                const active =
                  isActive(
                    item.href
                  );


                return (

                  <Link
                    key={item.href}
                    href={
                      buildNavigationHref(
                        item.href
                      )
                    }
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >

                    <Icon size={18} />

                    {item.name}

                  </Link>

                );

              }
            )}

          </nav>


          {/* AI EMPLOYEE */}

          <div className="mt-10 border-t border-gray-200 pt-6">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              AI Employee
            </p>


            {agents.length > 0 ? (

              <>

                <select
                  value={
                    selectedAgentId ??
                    ""
                  }
                  onChange={
                    handleAgentChange
                  }
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-gray-500"
                >

                  {agents.map(
                    (agent) => (

                      <option
                        key={agent.id}
                        value={agent.id}
                      >
                        {agent.name}
                      </option>

                    )
                  )}

                </select>


                {selectedAgent && (

                  <div className="mt-3 rounded-lg bg-gray-50 p-3">

                    <p className="text-xs font-medium text-gray-600">
                      {selectedAgent.department}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {selectedAgent.workflow}
                    </p>

                  </div>

                )}

              </>

            ) : (

              <p className="mt-3 text-sm text-gray-500">
                No AI employees found.
              </p>

            )}

          </div>

        </div>

      </aside>

    </>
  );
}