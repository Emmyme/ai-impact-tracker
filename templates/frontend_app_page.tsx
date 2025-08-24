"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserManagement } from "@/components/auth/user-management";
import { useAuth } from "@/contexts/auth-context";
import {
  LogOut,
  User,
  Activity,
  Zap,
  Droplets,
  Leaf,
  RefreshCw,
} from "lucide-react";
import * as d3 from "d3";

interface Metric {
  id: number;
  project: string;
  energy_consumption: number;
  co2_emissions: number;
  water_usage: number;
  duration: number;
  timestamp: string;
  environment: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 5;
  const chartRef = useRef<HTMLDivElement>(null);
  const energyChartRef = useRef<HTMLDivElement>(null);
  const comparisonChartRef = useRef<HTMLDivElement>(null);
  const environmentalChartRef = useRef<HTMLDivElement>(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Fetch metrics when user logs in
  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  // Create energy consumption line chart
  useEffect(() => {
    if (metrics.length > 0 && energyChartRef.current && !loading) {
      const margin = { top: 20, right: 30, bottom: 30, left: 60 };
      const width = 600 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      // Clear previous chart
      d3.select(energyChartRef.current).selectAll("*").remove();

      const svg = d3
        .select(energyChartRef.current)
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const data = metrics.slice(-10).map((m, i) => ({
        index: i,
        energy: m.energy_consumption,
        water: m.water_usage || 0,
        timestamp: new Date(m.timestamp),
      }));

      const x = d3
        .scaleLinear()
        .domain([0, data.length - 1])
        .range([0, width]);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => Math.max(d.energy, d.water)) || 0])
        .range([height, 0]);

      // Add energy line
      const energyLine = d3
        .line<{
          index: number;
          energy: number;
          water: number;
          timestamp: Date;
        }>()
        .x((d) => x(d.index))
        .y((d) => y(d.energy))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#22c55e")
        .attr("stroke-width", 3)
        .attr("d", energyLine);

      // Add water line
      const waterLine = d3
        .line<{
          index: number;
          energy: number;
          water: number;
          timestamp: Date;
        }>()
        .x((d) => x(d.index))
        .y((d) => y(d.water))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 3)
        .attr("d", waterLine);

      // Add axes
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(data.length));

      svg.append("g").call(d3.axisLeft(y));

      // Add legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - 100}, 20)`);

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#22c55e")
        .attr("stroke-width", 3);

      legend
        .append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .text("Energy")
        .style("fill", "currentColor");

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 20)
        .attr("y2", 20)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 3);

      legend
        .append("text")
        .attr("x", 25)
        .attr("y", 20)
        .attr("dy", "0.35em")
        .text("Water")
        .style("fill", "currentColor");
    }
  }, [metrics, loading]);

  // Create project comparison chart
  useEffect(() => {
    if (metrics.length > 0 && comparisonChartRef.current && !loading) {
      const margin = { top: 40, right: 30, bottom: 60, left: 60 };
      const width = 600 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      // Clear previous chart
      d3.select(comparisonChartRef.current).selectAll("*").remove();

      const svg = d3
        .select(comparisonChartRef.current)
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Group by project
      const projectData = d3.group(metrics, (d) => d.project);
      const projectAverages = Array.from(projectData.entries()).map(
        ([project, data]) => ({
          project,
          avgEnergy: d3.mean(data, (d) => d.energy_consumption) || 0,
          avgCO2: d3.mean(data, (d) => d.co2_emissions) || 0,
          avgWater: d3.mean(data, (d) => d.water_usage) || 0,
        })
      );

      const x = d3
        .scalePoint()
        .domain(projectAverages.map((d) => d.project))
        .range([0, width])
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(projectAverages, (d) => d.avgEnergy) || 0])
        .range([height, 0]);

      // Add bars
      svg
        .selectAll(".bar")
        .data(projectAverages)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.project) || 0)
        .attr("width", x.bandwidth())
        .attr("y", (d) => y(d.avgEnergy))
        .attr("height", (d) => height - y(d.avgEnergy))
        .attr("fill", "#22c55e");

      // Add axes
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("fill", "currentColor");

      svg.append("g").call(d3.axisLeft(y)).style("fill", "currentColor");
    }
  }, [metrics, loading]);

  // Create environmental impact chart
  useEffect(() => {
    if (metrics.length > 0 && environmentalChartRef.current && !loading) {
      const margin = { top: 20, right: 30, bottom: 30, left: 60 };
      const width = 600 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      // Clear previous chart
      d3.select(environmentalChartRef.current).selectAll("*").remove();

      const svg = d3
        .select(environmentalChartRef.current)
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const data = metrics.slice(-10).map((m, i) => ({
        index: i,
        co2: m.co2_emissions,
        water: m.water_usage || 0,
        timestamp: new Date(m.timestamp),
      }));

      const x = d3
        .scaleLinear()
        .domain([0, data.length - 1])
        .range([0, width]);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => Math.max(d.co2, d.water)) || 0])
        .range([height, 0]);

      // Add CO2 line
      const co2Line = d3
        .line<{ index: number; co2: number; water: number; timestamp: Date }>()
        .x((d) => x(d.index))
        .y((d) => y(d.co2))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 3)
        .attr("d", co2Line);

      // Add water line
      const waterLine = d3
        .line<{ index: number; co2: number; water: number; timestamp: Date }>()
        .x((d) => x(d.index))
        .y((d) => y(d.water))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 3)
        .attr("d", waterLine);

      // Add axes
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(data.length));

      svg.append("g").call(d3.axisLeft(y));

      // Add legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - 100}, 20)`);

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 3);

      legend
        .append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .text("CO₂")
        .style("fill", "currentColor");

      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 20)
        .attr("y2", 20)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 3);

      legend
        .append("text")
        .attr("x", 25)
        .attr("y", 20)
        .attr("dy", "0.35em")
        .text("Water")
        .style("fill", "currentColor");
    }
  }, [metrics, loading]);

  // Pagination for recent training sessions
  const totalPages = Math.ceil(metrics.length / sessionsPerPage);
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const endIndex = startIndex + sessionsPerPage;
  const currentSessions = metrics.slice(startIndex, endIndex);

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">
                AI Sustainability Dashboard
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMetrics}
                className="text-green-600 hover:text-green-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.full_name}</span>
                <Badge variant="secondary">{user?.role}</Badge>
              </div>
              {(user?.role === "admin" || user?.role === "developer") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserManagement(true)}
                >
                  Manage Users
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Energy
                    </CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics
                        .reduce(
                          (sum, m) => sum + (m.energy_consumption || 0),
                          0
                        )
                        .toFixed(9)}{" "}
                      kWh
                    </div>
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
                      {metrics
                        .reduce((sum, m) => sum + (m.co2_emissions || 0), 0)
                        .toFixed(9)}{" "}
                      g
                    </div>
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
                      {metrics
                        .reduce((sum, m) => sum + (m.water_usage || 0), 0)
                        .toFixed(9)}{" "}
                      mL
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Sessions
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Energy Consumption Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={energyChartRef} className="w-full h-80"></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Project Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div ref={comparisonChartRef} className="w-full h-80"></div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Environmental Impact Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    ref={environmentalChartRef}
                    className="w-full h-80"
                  ></div>
                </CardContent>
              </Card>

              {/* Recent Training Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Training Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentSessions.map((metric) => (
                      <div
                        key={metric.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors relative group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{metric.project}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(metric.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">{metric.environment}</Badge>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-card border rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Energy:</span>
                              <span>
                                {(metric.energy_consumption || 0).toFixed(9)}{" "}
                                kWh
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">CO₂:</span>
                              <span>
                                {(metric.co2_emissions || 0).toFixed(9)} g
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Water:</span>
                              <span>
                                {(metric.water_usage || 0).toFixed(9)} mL
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Duration:</span>
                              <span>{metric.duration} seconds</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center space-x-2 mt-4">
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
                      <span className="flex items-center px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* User Management Modal */}
        {showUserManagement && (
          <Modal
            isOpen={showUserManagement}
            onClose={() => setShowUserManagement(false)}
            title="Manage Users"
          >
            <UserManagement />
          </Modal>
        )}
      </div>
    </ProtectedRoute>
  );
}
