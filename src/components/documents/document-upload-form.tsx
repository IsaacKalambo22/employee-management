"use client"

import { useActionState } from "react"
import { Upload, X, FileText, Trash2 } from "lucide-react"
import { uploadDocument, deleteDocument } from "@/lib/actions/documents"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface DocumentUploadFormProps {
  employeeId: string
  existingDocuments: any[]
}

export function DocumentUploadForm({ employeeId, existingDocuments }: DocumentUploadFormProps) {
  const [state, formAction, isPending] = useActionState(uploadDocument, {
    message: "",
    success: false,
  })

  const handleDelete = async (documentId: string) => {
    const result = await deleteDocument(documentId)
    if (result.success) {
      toast.success("Document deleted successfully")
    } else {
      toast.error(result.message ?? "Failed to delete document")
    }
  }

  if (state.success) {
    toast.success(state.message)
    return null
  }

  if (state.message && !state.success) {
    toast.error(state.message)
  }

  return (
    <div className="space-y-4">
      {/* Upload Form */}
      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="employeeId" value={employeeId} />
            
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <select
                id="documentType"
                name="documentType"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select type...</option>
                <option value="ID_CARD">ID Card</option>
                <option value="CV">CV/Resume</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="CONTRACT">Contract</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {isPending ? "Uploading..." : "Upload Document"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-3">Existing Documents</h3>
            <div className="space-y-2">
              {existingDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{doc.documentType.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
