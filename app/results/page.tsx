"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, FileText } from "lucide-react"
import Link from "next/link"

interface AnalysisResult {
  embryoId: string
  ploidyStatus: "Euploid" | "Aneuploid"
  confidenceScore: number
}

export default function ResultsPage() {
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading and generating results
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock results data - in a real app, this would come from the ML analysis
      const mockResults: AnalysisResult[] = [
        { embryoId: "Embryo 1", ploidyStatus: "Euploid", confidenceScore: 95 },
        { embryoId: "Embryo 2", ploidyStatus: "Aneuploid", confidenceScore: 88 },
        { embryoId: "Embryo 3", ploidyStatus: "Euploid", confidenceScore: 92 },
        { embryoId: "Embryo 4", ploidyStatus: "Aneuploid", confidenceScore: 75 },
        { embryoId: "Embryo 5", ploidyStatus: "Aneuploid", confidenceScore: 98 },
      ]
      setResults(mockResults)
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleExportResults = () => {
    // Create CSV content
    const csvContent = [
      ["Embryo ID", "Ploidy Status", "Confidence Score"],
      ...results.map((result) => [result.embryoId, result.ploidyStatus, `${result.confidenceScore}%`]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/xlsx" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "embryo_ploidy_results.xlsx"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const euploidCount = results.filter((r) => r.ploidyStatus === "Euploid").length
  const aneuploidCount = results.filter((r) => r.ploidyStatus === "Aneuploid").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <img
            src="/images/feto.png"
            alt="Ícone de embrião"
            className="w-6 h-6 object-contain"
          />
            <span className="font-semibold text-lg">Embryo Predict</span>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Upload
            </Button>
          </Link>
        </div>
      </header>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <img
            src="/images/feto.png"
            alt="Ícone de embrião"
            className="w-6 h-6 object-contain"
          />
          <span className="font-semibold text-lg">Preditor de Embriões</span>
        </div>
        <nav className="flex gap-6 items-center">
          <a href="#about" className="text-gray-600 hover:text-gray-900">
            Sobre
          </a>
          <a href="#upload" className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
            Carregar Dados
          </a>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ploidy Analysis Results</h1>
          <p className="text-gray-600 text-lg">Review the ploidy status for each embryo based on your uploaded data.</p>
        </div>

        {isLoading ? (
          /* Loading State */
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Analyzing Your Data</h3>
              <p className="text-gray-600">
                Our AI model is processing your embryo data. This may take a few moments...
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{results.length}</div>
                  <div className="text-gray-600">Total Embryos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{euploidCount}</div>
                  <div className="text-gray-600">Euploid</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{aneuploidCount}</div>
                  <div className="text-gray-600">Aneuploid</div>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            <Card className="mb-8">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Embryo ID</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Ploidy Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Confidence Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={result.embryoId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="py-4 px-6 font-medium text-gray-900">{result.embryoId}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                result.ploidyStatus === "Euploid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {result.ploidyStatus}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-900 font-medium">{result.confidenceScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleExportResults} className="flex items-center gap-2 bg-green-700 hover:bg-green-800">
                <Download className="w-4 h-4" />
                Export Results
              </Button>
              <Link href="/">
                <Button variant="outline">Analyze New Data</Button>
              </Link>
            </div>

            {/* Additional Information */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Understanding Your Results</h3>
                <div className="space-y-3 text-gray-700">
                  <div>
                    <strong className="text-green-700">Euploid:</strong> Embryos with the correct number of chromosomes,
                    indicating normal genetic content and higher viability potential.
                  </div>
                  <div>
                    <strong className="text-red-700">Aneuploid:</strong> Embryos with abnormal chromosome numbers, which
                    may indicate lower viability or genetic abnormalities.
                  </div>
                  <div>
                    <strong>Confidence Score:</strong> The AI model's confidence level in the prediction, with higher
                    percentages indicating greater certainty in the classification.
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
