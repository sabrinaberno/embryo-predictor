"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, FileText } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"

interface AnalysisResult {
  embryoId: string
  ploidyStatus: "Euploide" | "Aneuploide"
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
        { embryoId: "Embryo 1", ploidyStatus: "Euploide", confidenceScore: 95 },
        { embryoId: "Embryo 2", ploidyStatus: "Aneuploide", confidenceScore: 88 },
        { embryoId: "Embryo 3", ploidyStatus: "Euploide", confidenceScore: 92 },
        { embryoId: "Embryo 4", ploidyStatus: "Aneuploide", confidenceScore: 75 },
        { embryoId: "Embryo 5", ploidyStatus: "Aneuploide", confidenceScore: 98 },
      ]
      setResults(mockResults)
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleExportResults = () => {
      const ws = XLSX.utils.json_to_sheet(results.map((r) => ({
        "Embryo ID": r.embryoId,
        "Previsão de Ploidia": r.ploidyStatus,
        "Nível de Confiança (%)": r.confidenceScore,
      })))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Resultados")

      XLSX.writeFile(wb, "embryo_ploidy_results.xlsx")
    }

  const euploidCount = results.filter((r) => r.ploidyStatus === "Euploide").length
  const aneuploidCount = results.filter((r) => r.ploidyStatus === "Aneuploide").length

  return (
    <div className="min-h-screen bg-gray-50">
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
          <ArrowLeft className="w-4 h-4" />
          <a href="/" className="text-gray-600 hover:text-gray-900">
            Voltar para o Upload
          </a>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Resultados da Análise de Ploidia</h1>
          <p className="text-gray-600 text-lg">Confira a previsão de ploidia de cada embrião com base nos dados enviados.</p>
        </div>

        {isLoading ? (
          /* Loading State */
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Analisando Seus Dados</h3>
              <p className="text-gray-600">
                Nosso modelo de IA está processando os dados dos embriões. Isso pode levar alguns instantes...
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
                  <div className="text-gray-600">Total de embriões</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{euploidCount}</div>
                  <div className="text-gray-600">Euploide</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{aneuploidCount}</div>
                  <div className="text-gray-600">Aneuploide</div>
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
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Previsão de Ploidia</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Nível de Confiança</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={result.embryoId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="py-4 px-6 font-medium text-gray-900">{result.embryoId}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                result.ploidyStatus === "Euploide"
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
                Exportar Resultados
              </Button>
              <Link href="/">
                <Button variant="outline">Analisar novos dados</Button>
              </Link>
            </div>

            {/* Additional Information */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Entendendo Seus Resultados</h3>
                <div className="space-y-3 text-gray-700">
                  <div>
                    <strong className="text-green-700">Euploide:</strong> Embriões com o número correto de cromossomos,
                    indicando um conteúdo genético normal e maior potencial de viabilidade.
                  </div>
                  <div>
                    <strong className="text-red-700">Aneuploide:</strong> Embriões com número anormal de cromossomos, o que
                    pode indicar menor viabilidade ou anomalias genéticas.
                  </div>
                  <div>
                    <strong> Nível de Confiança:</strong> Nível de confiança do modelo de IA na previsão, sendo que
                    percentuais mais altos indicam maior certeza na classificação.
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
