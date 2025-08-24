"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserManagement } from "@/components/auth/user-management";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/contexts/auth-context";
import { ModeToggle } from "@/components/mode-toggle";

import {
  Leaf,
  Zap,
  Droplets,
  Clock,
  Users,
  FolderOpen,
  RefreshCw,
  User,
  LogOut,
} from "lucide-react";
import * as d3 from "d3";

interface Metric {
  id: number;
  project: string;
  energy_consumed: number;
  emissions: number;
  duration: number;
  timestamp: string;
  environment: string;
  water_usage?: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const sessionsPerPage = 5;
  const chartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      fetchMetrics();
    }
  }, [user]);

  useEffect(() => {
    if (metrics.length > 0 && chartRef.current && !loading) {
      createEnergyChart();
    }
  }, [metrics, loading]);

  useEffect(() => {
    if (metrics.length > 0 && barChartRef.current) {
      createProjectComparisonChart();
    }
  }, [metrics]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      console.log("Fetching metrics from backend...");
      const response = await fetch("http://localhost:8000/api/metrics");
      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched metrics:", data);
        setMetrics(data);
      } else {
        console.error(
          "Failed to fetch metrics:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const createEnergyChart = () => {
    if (!chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    const margin = { top: 80, right: 30, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data - last 10 sessions, sorted by timestamp
    const chartData = metrics
      .slice()
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .slice(-10)
      .map((metric, index) => ({
        session: `Session ${index + 1}`,
        energy: metric.energy_consumed * 1000, // Convert to Wh for better visibility
        emissions: metric.emissions * 1000, // Convert to mg CO2 (since we store in g)
        water: (metric.water_usage || 0) * 1, // Keep in mL (since we store in mL)
        timestamp: new Date(metric.timestamp),
        project: metric.project,
      }));

    // X scale (time-based)
    const x = d3
      .scalePoint()
      .range([0, width])
      .domain(chartData.map((d) => d.session))
      .padding(0.5);

    // Y scale - use the maximum value across all metrics for better scaling
    const maxValue =
      d3.max(chartData, (d) => Math.max(d.energy, d.emissions, d.water)) || 0;

    const y = d3.scaleLinear().domain([0, maxValue]).range([height, 0]);

    // Create line generators for each metric
    const energyLine = d3
      .line<{
        session: string;
        energy: number;
        emissions: number;
        water: number;
        timestamp: Date;
        project: string;
      }>()
      .x((d) => x(d.session) || 0)
      .y((d) => y(d.energy))
      .curve(d3.curveMonotoneX);

    const emissionsLine = d3
      .line<{
        session: string;
        energy: number;
        emissions: number;
        water: number;
        timestamp: Date;
        project: string;
      }>()
      .x((d) => x(d.session) || 0)
      .y((d) => y(d.emissions))
      .curve(d3.curveMonotoneX);

    const waterLine = d3
      .line<{
        session: string;
        energy: number;
        emissions: number;
        water: number;
        timestamp: Date;
        project: string;
      }>()
      .x((d) => x(d.session) || 0)
      .y((d) => y(d.water))
      .curve(d3.curveMonotoneX);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .style("fill", "currentColor")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "currentColor");

    // Add the line paths
    svg
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 3)
      .attr("d", energyLine);

    svg
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3)
      .attr("d", emissionsLine);

    svg
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#06b6d4")
      .attr("stroke-width", 3)
      .attr("d", waterLine);

    // Add data points for energy
    svg
      .selectAll("circle.energy")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "energy")
      .attr("cx", (d) => x(d.session) || 0)
      .attr("cy", (d) => y(d.energy))
      .attr("r", 4)
      .attr("fill", "#10b981")
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("r", 6);
        svg
          .append("text")
          .attr("class", "tooltip")
          .attr("x", (x(d.session) || 0) + 10)
          .attr("y", y(d.energy) - 10)
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", "currentColor")
          .text(`Energy: ${d.energy.toFixed(1)} Wh`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8).attr("r", 4);
        svg.selectAll(".tooltip").remove();
      });

    // Add data points for emissions
    svg
      .selectAll("circle.emissions")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "emissions")
      .attr("cx", (d) => x(d.session) || 0)
      .attr("cy", (d) => y(d.emissions))
      .attr("r", 4)
      .attr("fill", "#ef4444")
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("r", 6);
        svg
          .append("text")
          .attr("class", "tooltip")
          .attr("x", (x(d.session) || 0) + 10)
          .attr("y", y(d.emissions) - 10)
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", "currentColor")
          .text(`CO₂: ${d.emissions.toFixed(1)} mg`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8).attr("r", 4);
        svg.selectAll(".tooltip").remove();
      });

    // Add data points for water
    svg
      .selectAll("circle.water")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "water")
      .attr("cx", (d) => x(d.session) || 0)
      .attr("cy", (d) => y(d.water))
      .attr("r", 4)
      .attr("fill", "#06b6d4")
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("r", 6);
        svg
          .append("text")
          .attr("class", "tooltip")
          .attr("x", (x(d.session) || 0) + 10)
          .attr("y", y(d.water) - 10)
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", "currentColor")
          .text(`Water: ${d.water.toFixed(1)} mL`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8).attr("r", 4);
        svg.selectAll(".tooltip").remove();
      });

    // Add legend
    const legend = svg.append("g").attr("class", "legend");

    // Energy legend
    legend
      .append("line")
      .attr("x1", width - 160)
      .attr("y1", -70)
      .attr("x2", width - 140)
      .attr("y2", -70)
      .attr("stroke", "#10b981")
      .attr("stroke-width", 2);

    legend
      .append("text")
      .attr("x", width - 135)
      .attr("y", -67)
      .style("font-size", "12px")
      .style("fill", "currentColor")
      .text("Energy (Wh)");

    // Emissions legend
    legend
      .append("line")
      .attr("x1", width - 160)
      .attr("y1", -50)
      .attr("x2", width - 140)
      .attr("y2", -50)
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2);

    legend
      .append("text")
      .attr("x", width - 135)
      .attr("y", -47)
      .style("font-size", "12px")
      .style("fill", "currentColor")
      .text("CO₂ (mg)");

    // Water legend
    legend
      .append("line")
      .attr("x1", width - 160)
      .attr("y1", -30)
      .attr("x2", width - 140)
      .attr("y2", -30)
      .attr("stroke", "#06b6d4")
      .attr("stroke-width", 2);

    legend
      .append("text")
      .attr("x", width - 135)
      .attr("y", -27)
      .style("font-size", "12px")
      .style("fill", "currentColor")
      .text("Water (mL)");
  };

  const createProjectComparisonChart = () => {
    if (!barChartRef.current) return;

    // Clear previous chart
    d3.select(barChartRef.current).selectAll("*").remove();

    const margin = { top: 80, right: 30, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(barChartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Group data by project
    const projectData = d3.group(metrics, (d) => d.project);
    const chartData = Array.from(projectData.entries()).map(
      ([project, sessions]) => ({
        project,
        totalEnergy: d3.sum(sessions, (d) => d.energy_consumed) * 1000000, // Convert to micro-kWh
        totalEmissions: d3.sum(sessions, (d) => d.emissions) * 1000000, // Convert to micro-kg
        sessionCount: sessions.length,
      })
    );

    // X scale
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(chartData.map((d) => d.project))
      .padding(0.2);

    // Y scale
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.totalEnergy) || 0])
      .range([height, 0]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("fill", "currentColor")
      .attr("dy", ".8em");

    // Add Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "currentColor");

    // Add bars
    svg
      .selectAll("rect")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.project) || 0)
      .attr("y", (d) => y(d.totalEnergy))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.totalEnergy))
      .attr("fill", "#10b981")
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1);
        svg
          .append("text")
          .attr("class", "tooltip")
          .attr("x", (x(d.project) || 0) + x.bandwidth() / 2)
          .attr("y", y(d.totalEnergy) - 20)
          .attr("text-anchor", "middle")
          .style("fill", "currentColor")
          .text(
            `${d.totalEnergy.toFixed(2)} μkWh (${d.sessionCount} sessions)`
          );
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8);
        svg.selectAll(".tooltip").remove();
      });
  };

  const totalEnergy = metrics.reduce(
    (sum, metric) => sum + metric.energy_consumed,
    0
  );
  const totalEmissions = metrics.reduce(
    (sum, metric) => sum + metric.emissions,
    0
  );
  const totalWaterUsage = metrics.reduce(
    (sum, metric) => sum + (metric.water_usage || 0),
    0
  );
  const totalDuration = metrics.reduce(
    (sum, metric) => sum + metric.duration,
    0
  );
  const uniqueProjects = new Set(metrics.map((m) => m.project)).size;

  // Pagination
  const totalPages = Math.ceil(metrics.length / sessionsPerPage);
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const endIndex = startIndex + sessionsPerPage;
  const currentSessions = metrics.slice().reverse().slice(startIndex, endIndex);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                AI Sustainability Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Track environmental impact of AI workloads
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {user && (
                <div className="flex items-center gap-2 mr-4">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {user.full_name} ({user.role})
                  </span>
                  {(user.role === "admin" || user.role === "developer") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUserManagement(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
              <ModeToggle />
              <Button onClick={fetchMetrics} disabled={loading}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Energy
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalEnergy.toFixed(2)} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.length} training sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  CO₂ Emissions
                </CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalEmissions.toFixed(2)} g
                </div>
                <p className="text-xs text-muted-foreground">
                  Carbon footprint
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Duration
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(totalDuration / 3600).toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">Training time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Water Usage
                </CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalWaterUsage.toFixed(2)} mL
                </div>
                <p className="text-xs text-muted-foreground">Cooling water</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueProjects}</div>
                <p className="text-xs text-muted-foreground">Active projects</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={chartRef}
                  className="w-full h-80 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="text-center text-gray-500">
                      Loading chart...
                    </div>
                  ) : metrics.length === 0 ? (
                    <div className="text-center text-gray-500">
                      No data available
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Energy Consumption by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={barChartRef}
                  className="w-full h-80 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="text-center text-gray-500">
                      Loading chart...
                    </div>
                  ) : metrics.length === 0 ? (
                    <div className="text-center text-gray-500">
                      No data available
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Training Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading metrics...</div>
              ) : metrics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No metrics found. Start tracking your AI training sessions!
                </div>
              ) : (
                <div className="space-y-4">
                  {currentSessions.map((metric) => (
                    <div
                      key={metric.id}
                      className="relative flex items-center justify-between p-4 border rounded-lg group"
                    >
                      {/* Hover Card */}
                      {/* Hover Card */}
                      <div className="absolute -top-2 -left-2 bg-card border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 p-4 shadow-xl min-w-[300px]">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-lg text-foreground">
                            {metric.project}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(metric.timestamp).toLocaleDateString()} at{" "}
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </p>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Energy Consumed
                              </p>
                              <p className="font-mono text-sm text-foreground">
                                {metric.energy_consumed.toFixed(9)} kWh
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                CO₂ Emissions
                              </p>
                              <p className="font-mono text-sm text-foreground">
                                {metric.emissions.toFixed(9)} g
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Duration
                              </p>
                              <p className="font-mono text-sm text-foreground">
                                {metric.duration.toFixed(9)} seconds
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Water Usage
                              </p>
                              <p className="font-mono text-sm text-foreground">
                                {(metric.water_usage || 0).toFixed(9)} mL
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              Environment
                            </p>
                            <p className="font-mono text-sm text-foreground">
                              {metric.environment}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{metric.project}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(metric.timestamp).toLocaleDateString()} at{" "}
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="secondary">{metric.environment}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {metric.energy_consumed.toFixed(2)} kWh
                        </div>
                        <div className="text-sm text-gray-500">
                          {metric.emissions.toFixed(2)} g CO₂
                        </div>
                        {metric.water_usage && (
                          <div className="text-sm text-blue-500">
                            {metric.water_usage.toFixed(2)} mL water
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, metrics.length)} of {metrics.length}{" "}
                        sessions
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Management Modal */}
        <Modal
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          title="User Management"
        >
          <UserManagement />
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
