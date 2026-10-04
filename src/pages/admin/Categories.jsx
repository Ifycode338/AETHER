import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
      .limit(50);
    if (error) console.error('Error loading categories:', error);
    else setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete);
      if (error) console.error('Error deleting category:', error);
      else load();
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const openDeleteConfirm = (id) => {
    setCategoryToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Categories</h1>
          <p className="text-sm text-white/40 mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={openNew} className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl h-10 text-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      {showForm && (
        <CategoryForm
          category={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#22C55E]/20 border-t-[#22C55E] rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Tags className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No categories yet. Add your first category to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {categories.map(category => (
            <div key={category.id} className="bg-[#071f15] border border-[#22C55E]/10 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[#22C55E] text-xl">📂</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-sm truncate">{category.name}</h3>
                <p className="text-xs text-white/30">{category.description || "No description"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(category)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => openDeleteConfirm(category.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-[#071f15] border border-[#22C55E]/10 mx-4 sm:mx-auto max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-lg sm:text-xl">Delete Category?</DialogTitle>
            <DialogDescription className="text-white/60 text-sm sm:text-base">
              This action is permanent and cannot be undone. The category will be removed from your store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl border-white/10 text-white/60 hover:bg-white/5 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-600 rounded-xl w-full sm:w-auto"
            >
              {deleting ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tags({ className }) {
  return <div className={className}>📂</div>;
}

function CategoryForm({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (category) {
        const { error } = await supabase.from('categories').update(form).eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(form);
        if (error) throw error;
      }
      onSaved();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#22C55E]/10">
          <h2 className="font-heading font-semibold text-white">{category ? "Edit Category" : "Add Category"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Category Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-white/20"
              placeholder="e.g., Supplements"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-white/20 resize-none"
              placeholder="Brief description of this category"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/60 hover:bg-white/5 rounded-xl h-11">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl h-11 disabled:opacity-50">
              {saving ? "Saving..." : category ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
