import { useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompanyRoleListItem, RoleSourceBrowseResult } from "@paperclipai/shared";
import { companyRolesApi, roleSourcesApi } from "../api/roles";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { MarkdownBody } from "../components/MarkdownBody";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "../lib/utils";
import { Folder, Plus, Trash2, Download, Search, Users } from "lucide-react";

export function CompanyRoles() {
  const queryClient = useQueryClient();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceRef, setNewSourceRef] = useState("");
  const [browseData, setBrowseData] = useState<RoleSourceBrowseResult | null>(null);
  const [selectedImportPaths, setSelectedImportPaths] = useState<Set<string>>(new Set());

  setBreadcrumbs([
    { label: selectedCompany?.name ?? "Company" },
    { label: "Roles" },
  ]);

  const rolesQuery = useQuery({
    queryKey: queryKeys.companyRoles.list(selectedCompanyId ?? ""),
    queryFn: () => companyRolesApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });

  const sourcesQuery = useQuery({
    queryKey: queryKeys.roleSources.list(selectedCompanyId ?? ""),
    queryFn: () => roleSourcesApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.companyRoles.detail(selectedCompanyId ?? "", selectedRoleId ?? ""),
    queryFn: () => companyRolesApi.detail(selectedCompanyId!, selectedRoleId!),
    enabled: Boolean(selectedCompanyId && selectedRoleId),
  });

  const filteredRoles = useMemo(() => {
    const roles = rolesQuery.data ?? [];
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q),
    );
  }, [rolesQuery.data, search]);

  const groupedRoles = useMemo(() => {
    const groups: Record<string, CompanyRoleListItem[]> = {};
    for (const role of filteredRoles) {
      const cat = role.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(role);
    }
    return groups;
  }, [filteredRoles]);

  const addSourceMutation = useMutation({
    mutationFn: () =>
      roleSourcesApi.create(selectedCompanyId!, {
        name: newSourceName.trim(),
        url: newSourceUrl.trim(),
        ref: newSourceRef.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.roleSources.list(selectedCompanyId!) });
      setAddSourceOpen(false);
      setNewSourceUrl("");
      setNewSourceName("");
      setNewSourceRef("");
      pushToast({ tone: "success", title: "Source added" });
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Failed to add source",
        body: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (sourceId: string) => roleSourcesApi.delete(selectedCompanyId!, sourceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.roleSources.list(selectedCompanyId!) });
      pushToast({ tone: "success", title: "Source removed" });
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Failed to remove source",
        body: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const browseMutation = useMutation({
    mutationFn: (sourceId: string) => roleSourcesApi.browse(selectedCompanyId!, sourceId),
    onSuccess: (data) => {
      setBrowseData(data);
      setSelectedImportPaths(new Set());
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Failed to browse source",
        body: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!browseData || selectedImportPaths.size === 0) throw new Error("Nothing selected");
      return companyRolesApi.importFromSource(selectedCompanyId!, browseData.sourceId, [
        ...selectedImportPaths,
      ]);
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companyRoles.list(selectedCompanyId!) });
      setImportDialogOpen(false);
      setBrowseData(null);
      setSelectedImportPaths(new Set());
      pushToast({
        tone: "success",
        title: "Roles imported",
        body: `${result.imported.length} role${result.imported.length === 1 ? "" : "s"} imported.`,
      });
      if (result.warnings.length > 0) {
        pushToast({ tone: "warn", title: "Import warnings", body: result.warnings.join(", ") });
      }
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Import failed",
        body: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => companyRolesApi.delete(selectedCompanyId!, roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companyRoles.list(selectedCompanyId!) });
      setSelectedRoleId(null);
      pushToast({ tone: "success", title: "Role deleted" });
    },
    onError: (err) => {
      pushToast({
        tone: "error",
        title: "Failed to delete role",
        body: err instanceof Error ? err.message : "Unknown error",
      });
    },
  });

  if (!selectedCompanyId) {
    return <EmptyState icon={Users} message="Select a company to manage roles." />;
  }

  return (
    <div className="flex h-full">
      {/* LEFT PANEL */}
      <div className="w-80 shrink-0 border-r border-border overflow-y-auto">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-semibold">Roles</h1>
              <p className="text-xs text-muted-foreground">
                {rolesQuery.data?.length ?? 0} available
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setImportDialogOpen(true);
                setBrowseData(null);
                setSelectedImportPaths(new Set());
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2 border-b border-border pb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter roles"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Sources section */}
        {sourcesQuery.data && sourcesQuery.data.length > 0 && (
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sources</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setAddSourceOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {sourcesQuery.data.map((source) => (
              <div key={source.id} className="flex items-center gap-2 py-1 text-sm">
                <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{source.name}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  onClick={() => deleteSourceMutation.mutate(source.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {sourcesQuery.data?.length === 0 && (
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sources</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setAddSourceOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">No sources configured.</p>
          </div>
        )}

        {/* Roles by category */}
        {rolesQuery.isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading...</div>
        ) : Object.keys(groupedRoles).length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No roles found.</div>
        ) : (
          Object.entries(groupedRoles).map(([category, roles]) => (
            <div key={category} className="border-b border-border">
              <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-accent/30 transition-colors",
                    role.id === selectedRoleId && "bg-accent text-foreground",
                  )}
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{role.name}</span>
                  {role.assignedAgentCount > 0 && (
                    <span className="text-xs text-muted-foreground">{role.assignedAgentCount}</span>
                  )}
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-y-auto">
        {detailQuery.isLoading && selectedRoleId && (
          <div className="px-5 py-6 text-sm text-muted-foreground">Loading...</div>
        )}
        {!selectedRoleId && (
          <EmptyState icon={Users} message="Select a role to view details." />
        )}
        {selectedRoleId && detailQuery.data && (
          <div className="min-w-0">
            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold truncate">{detailQuery.data.name}</h1>
                  {detailQuery.data.description && (
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                      {detailQuery.data.description}
                    </p>
                  )}
                  {detailQuery.data.category && (
                    <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {detailQuery.data.category}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteRoleMutation.mutate(selectedRoleId)}
                  disabled={deleteRoleMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>

              {detailQuery.data.usedByAgents.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Used by</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {detailQuery.data.usedByAgents.map((agent) => (
                        <Link
                          key={agent.id}
                          to={`/agents/${agent.urlKey}`}
                          className="text-foreground no-underline hover:underline"
                        >
                          {agent.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-5">
              <MarkdownBody>{detailQuery.data.markdown}</MarkdownBody>
            </div>
          </div>
        )}
      </div>

      {/* ADD SOURCE DIALOG */}
      <Dialog open={addSourceOpen} onOpenChange={setAddSourceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Role Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              placeholder="Source name"
            />
            <Input
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              placeholder="Git repository URL"
            />
            <Input
              value={newSourceRef}
              onChange={(e) => setNewSourceRef(e.target.value)}
              placeholder="Branch or ref (optional)"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddSourceOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addSourceMutation.mutate()}
              disabled={addSourceMutation.isPending || !newSourceUrl.trim() || !newSourceName.trim()}
            >
              {addSourceMutation.isPending ? "Adding..." : "Add Source"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMPORT DIALOG */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Roles</DialogTitle>
          </DialogHeader>

          {!browseData ? (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Select a source to browse available roles.</p>
              {sourcesQuery.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sources configured. Add a source first.</p>
              ) : (
                <div className="space-y-2">
                  {sourcesQuery.data?.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      className="w-full flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-left hover:bg-accent/30 transition-colors"
                      onClick={() => browseMutation.mutate(source.id)}
                      disabled={browseMutation.isPending}
                    >
                      <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{source.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {browseData.categories.reduce((sum, c) => sum + c.entries.length, 0)} roles available
                </p>
                <Button variant="ghost" size="sm" onClick={() => { setBrowseData(null); setSelectedImportPaths(new Set()); }}>
                  Back to sources
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {browseData.categories.map((cat) => (
                  <div key={cat.name}>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      {cat.name}
                    </div>
                    {cat.entries.map((entry) => {
                      const isSelected = selectedImportPaths.has(entry.path);
                      return (
                        <label
                          key={entry.path}
                          className={cn(
                            "flex items-start gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-accent/30 transition-colors",
                            isSelected && "bg-accent/50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedImportPaths((prev) => {
                                const next = new Set(prev);
                                if (next.has(entry.path)) next.delete(entry.path);
                                else next.add(entry.path);
                                return next;
                              });
                            }}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="font-medium">{entry.name}</span>
                            {entry.description && (
                              <span className="block text-xs text-muted-foreground">{entry.description}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            {browseData && (
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending || selectedImportPaths.size === 0}
              >
                {importMutation.isPending
                  ? "Importing..."
                  : `Import ${selectedImportPaths.size} role${selectedImportPaths.size === 1 ? "" : "s"}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
