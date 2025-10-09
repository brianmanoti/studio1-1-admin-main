"use client";
import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { ChevronDown, ChevronRight, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ✅ Kenyan Currency Formatter
const formatKES = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(value || 0);

export default function BudgetComparisonTable({ estimateId }: { estimateId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["estimate", estimateId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/estimates/${estimateId}`);
      return res.data;
    },
  });

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  if (isLoading) return <p>Loading budget comparison...</p>;
  if (error) return <p>Error loading estimate.</p>;

  const estimate = data;

  // 🧾 Helper: Flatten data for export
  const flattenEstimateData = () => {
    const rows: any[] = [];

    estimate.groups.forEach((group: any) => {
      rows.push({
        Level: "Group",
        Code: group.code,
        Name: group.name,
        Description: group.description,
        Quantity: group.quantity,
        Unit: group.unit,
        Rate: group.rate,
        Total: group.total,
        Spent: group.spent,
        Balance: group.balance,
      });

      group.sections.forEach((section: any) => {
        rows.push({
          Level: "Section",
          Code: section.code,
          Name: section.name,
          Description: section.description,
          Quantity: section.quantity,
          Unit: section.unit,
          Rate: section.rate,
          Total: section.total,
          Spent: section.spent,
          Balance: section.balance,
        });

        section.subsections.forEach((sub: any) => {
          rows.push({
            Level: "Subsection",
            Code: sub.code,
            Name: sub.name,
            Description: sub.description,
            Quantity: sub.quantity,
            Unit: sub.unit,
            Rate: sub.rate,
            Total: sub.total,
            Spent: sub.spent,
            Balance: sub.balance,
          });
        });
      });
    });

    return rows;
  };

  // 📊 Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(flattenEstimateData());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Comparison");
    XLSX.writeFile(workbook, `${estimate.name}_Budget_Comparison.xlsx`);
  };

  // 📄 Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(estimate.name, 14, 15);
    doc.setFontSize(10);
    doc.text("Budget Comparison Summary", 14, 22);

    const rows = flattenEstimateData().map((r) => [
      r.Level,
      r.Code,
      r.Name,
      r.Description,
      r.Quantity,
      r.Unit,
      formatKES(r.Rate),
      formatKES(r.Total),
      formatKES(r.Spent),
      formatKES(r.Balance),
    ]);

    (doc as any).autoTable({
      head: [
        [
          "Level",
          "Code",
          "Name",
          "Description",
          "Qty",
          "Unit",
          "Rate (KES)",
          "Total (KES)",
          "Spent (KES)",
          "Balance (KES)",
        ],
      ],
      body: rows,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
      theme: "striped",
    });

    doc.save(`${estimate.name}_Budget_Comparison.pdf`);
  };

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSection = (id: string) =>
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{estimate.name}</h2>

        <div className="flex gap-2">
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <FileSpreadsheet size={16} />
            Export Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
            <FileDown size={16} />
            Export PDF
          </Button>
        </div>
      </div>

      <table className="w-full text-sm border border-gray-200 border-collapse">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">Code</th>
            <th className="p-2 border">Name / Description</th>
            <th className="p-2 border text-right">Qty</th>
            <th className="p-2 border text-right">Unit</th>
            <th className="p-2 border text-right">Rate</th>
            <th className="p-2 border text-right">Total (KES)</th>
            <th className="p-2 border text-right text-blue-600">Spent (KES)</th>
            <th className="p-2 border text-right text-green-600">Balance (KES)</th>
          </tr>
        </thead>

        <tbody>
          {estimate.groups.map((group: any) => {
            const isGroupOpen = expandedGroups.includes(group.grpId);
            return (
              <Fragment key={group.grpId}>
                {/* --- Group Row --- */}
                <tr
                  className="bg-gray-50 hover:bg-gray-100 cursor-pointer font-semibold"
                  onClick={() => toggleGroup(group.grpId)}
                >
                  <td className="p-2 border flex items-center gap-2">
                    {isGroupOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {group.code}
                  </td>
                  <td className="p-2 border">{group.name}</td>
                  <td className="p-2 border text-right">{group.quantity}</td>
                  <td className="p-2 border text-right">{group.unit}</td>
                  <td className="p-2 border text-right">{formatKES(group.rate)}</td>
                  <td className="p-2 border text-right font-bold">{formatKES(group.total)}</td>
                  <td className="p-2 border text-right text-blue-600">{formatKES(group.spent)}</td>
                  <td className="p-2 border text-right text-green-600 font-semibold">
                    {formatKES(group.balance)}
                  </td>
                </tr>

                {/* --- Section Rows --- */}
                {isGroupOpen &&
                  group.sections.map((section: any) => {
                    const isSectionOpen = expandedSections.includes(section.secId);
                    return (
                      <Fragment key={section.secId}>
                        <tr
                          className="bg-white hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleSection(section.secId)}
                        >
                          <td className="p-2 pl-6 border">
                            {isSectionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            {section.code}
                          </td>
                          <td className="p-2 border text-gray-700">{section.name}</td>
                          <td className="p-2 border text-right">{section.quantity}</td>
                          <td className="p-2 border text-right">{section.unit}</td>
                          <td className="p-2 border text-right">{formatKES(section.rate)}</td>
                          <td className="p-2 border text-right">{formatKES(section.total)}</td>
                          <td className="p-2 border text-right text-blue-600">
                            {formatKES(section.spent)}
                          </td>
                          <td className="p-2 border text-right text-green-600">
                            {formatKES(section.balance)}
                          </td>
                        </tr>

                        {/* --- Subsection Rows --- */}
                        {isSectionOpen &&
                          section.subsections.map((sub: any) => (
                            <tr key={sub.subId} className="bg-gray-50">
                              <td className="p-2 pl-10 border text-gray-500">{sub.code}</td>
                              <td className="p-2 border">{sub.name}</td>
                              <td className="p-2 border text-right">{sub.quantity}</td>
                              <td className="p-2 border text-right">{sub.unit}</td>
                              <td className="p-2 border text-right">{formatKES(sub.rate)}</td>
                              <td className="p-2 border text-right">{formatKES(sub.total)}</td>
                              <td className="p-2 border text-right text-blue-600">
                                {formatKES(sub.spent)}
                              </td>
                              <td className="p-2 border text-right text-green-600">
                                {formatKES(sub.balance)}
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    );
                  })}
              </Fragment>
            );
          })}

          {/* --- Overall Totals --- */}
          <tr className="font-bold bg-gray-100">
            <td className="p-2 border" colSpan={5}>
              GRAND TOTAL
            </td>
            <td className="p-2 border text-right">{formatKES(estimate.total)}</td>
            <td className="p-2 border text-right text-blue-600">{formatKES(estimate.spent)}</td>
            <td className="p-2 border text-right text-green-600">{formatKES(estimate.balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
