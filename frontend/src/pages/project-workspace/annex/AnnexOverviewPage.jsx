/**
 * AnnexOverviewPage
 * صفحة ملحقات المشروع
 */

import { Card, Alert } from '@/components/ui'
import { mockAnnexItems } from '@/data'

export default function AnnexOverviewPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background dark:bg-background-dark p-6 md:p-10 lg:p-12">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-border-default dark:border-border-dark pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black tracking-tight font-display">
              Annex & Attachments
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-lg font-normal">
              Reference documents and supporting materials
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert variant="info" title="About Annexes">
          This section contains standard reference documents and supporting materials that are
          commonly attached to environmental and social management plans. Each annex provides
          essential background information and documentation.
        </Alert>

        {/* Annex Items */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">library_books</span>
              Standard Annexes
            </h2>
            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
              <span className="material-symbols-outlined text-base">info</span>
              <span>{mockAnnexItems.length} items</span>
            </div>
          </div>

          {/* Annex Grid */}
          <div className="grid grid-cols-1 gap-4">
            {mockAnnexItems.map((item, index) => (
              <Card key={item._id} className="hover:shadow-md transition-shadow">
                <Card.Body>
                  <div className="flex items-start gap-4">
                    {/* Number Badge */}
                    <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-bold text-base text-text-main dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default dark:border-border-dark text-text-main dark:text-white font-medium text-sm hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      View
                    </button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </section>

        {/* Summary Table */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">table_chart</span>
            Annex Summary
          </h2>

          <div className="bg-white dark:bg-[#152a1d] rounded-xl shadow-sm border border-border-default dark:border-border-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-border-default dark:border-border-dark">
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockAnnexItems.map((item, index) => (
                    <tr
                      key={item._id}
                      className="border-b border-border-default dark:border-border-dark hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {String.fromCharCode(65 + index)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-main dark:text-white font-medium">
                          {item.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary dark:text-gray-400">
                          {item.description}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                            title="View annex"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                            title="Download annex"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
