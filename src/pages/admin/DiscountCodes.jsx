import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Plus, Pencil, Trash2, X, Tag as TagIcon, CheckCircle, Clock, Users, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function DiscountCodes() {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) console.error('Error loading discount codes:', error);
    else setDiscountCodes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!codeToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase.from('discount_codes').delete().eq('id', codeToDelete);
      if (error) console.error('Error deleting discount code:', error);
      else {
        toast.success('Discount code deleted');
        load();
      }
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setCodeToDelete(null);
    }
  };

  const openDeleteConfirm = (id) => {
    setCodeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const openEdit = (code) => {
    setEditing(code);
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-white">Discount Codes</h1>
          <p className="text-sm text-white/40 mt-1">{discountCodes.length} discount codes</p>
        </div>
        <Button onClick={openNew} className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl h-10 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Discount Code
        </Button>
      </div>

      {showForm && (
        <DiscountCodeForm
          discountCode={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#22C55E]/20 border-t-[#22C55E] rounded-full animate-spin" />
        </div>
      ) : discountCodes.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <TagIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No discount codes yet. Create your first discount code to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {discountCodes.map(code => (
            <div key={code.id} className="bg-[#071f15] border border-[#22C55E]/10 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                <TagIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#22C55E]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white text-sm sm:text-base">{code.code}</h3>
                  {code.is_active ? (
                    <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                  ) : (
                    <span className="text-xs text-white/30">Inactive</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-1">
                  <span className="text-xs text-[#22C55E] font-medium">{code.percentage}% off</span>
                  {code.description && (
                    <span className="text-xs text-white/30 truncate max-w-32">{code.description}</span>
                  )}
                  {code.max_uses && (
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {code.used_count}/{code.max_uses} uses
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(code)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => openDeleteConfirm(code.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
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
            <DialogTitle className="text-white text-lg sm:text-xl">Delete Discount Code?</DialogTitle>
            <DialogDescription className="text-white/60 text-sm sm:text-base">
              This action is permanent and cannot be undone. The discount code will be removed from your store.
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
              {deleting ? "Deleting..." : "Delete Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiscountCodeForm({ discountCode, onClose, onSaved }) {
  const [form, setForm] = useState({
    code: discountCode?.code || "",
    description: discountCode?.description || "",
    percentage: discountCode?.percentage || 10,
    max_uses: discountCode?.max_uses || "",
    valid_from: discountCode?.valid_from ? discountCode.valid_from.slice(0, 10) : "",
    valid_until: discountCode?.valid_until ? discountCode.valid_until.slice(0, 10) : "",
    is_active: discountCode?.is_active !== false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    const newErrors = {};
    if (!form.code.trim()) newErrors.code = 'Discount code is required';
    if (!form.percentage || form.percentage <= 0 || form.percentage > 100) {
      newErrors.percentage = 'Percentage must be between 1 and 100';
    }
    if (form.max_uses && parseInt(form.max_uses) <= 0) {
      newErrors.max_uses = 'Max uses must be greater than 0';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    const data = { 
      ...form, 
      percentage: parseInt(form.percentage),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    };
    
    try {
      if (discountCode) {
        const { error } = await supabase
          .from('discount_codes')
          .update(data)
          .eq('id', discountCode.id);
        
        if (error) throw error;
        toast.success('Discount code updated');
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert(data);
        
        if (error) throw error;
        toast.success('Discount code created');
      }
      onSaved();
    } catch (error) {
      console.error('Error saving discount code:', error);
      toast.error(`Failed to save discount code: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#22C55E]/10 sticky top-0 bg-[#071f15] z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
              <TagIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#22C55E]" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-white text-base sm:text-lg">
                {discountCode ? "Edit Discount Code" : "Add Discount Code"}
              </h2>
              <p className="text-xs text-white/40 hidden sm:block">
                {discountCode ? "Update discount code details" : "Create a new discount code"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <TagIcon className="w-4 h-4" />
              Discount Code
            </label>
            <input 
              required 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="BENNYCARE10"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border text-white text-sm focus:outline-none focus:ring-2 placeholder-white/20 transition-all ${
                errors.code ? 'border-red-500 focus:ring-red-500' : 'border-[#22C55E]/10 focus:ring-[#22C55E]'
              }`}
            />
            {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              Percentage (%)
            </label>
            <input 
              required 
              type="number" 
              min="1" 
              max="100"
              value={form.percentage} 
              onChange={e => setForm({ ...form, percentage: e.target.value })}
              placeholder="10"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border text-white text-sm focus:outline-none focus:ring-2 placeholder-white/20 transition-all ${
                errors.percentage ? 'border-red-500 focus:ring-red-500' : 'border-[#22C55E]/10 focus:ring-[#22C55E]'
              }`}
            />
            {errors.percentage && <p className="text-red-400 text-xs mt-1">{errors.percentage}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              Description
            </label>
            <input 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Special offer for new customers"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-white/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <Users className="w-4 h-4" />
                Max Uses (optional)
              </label>
              <input 
                type="number" 
                min="1"
                value={form.max_uses} 
                onChange={e => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Unlimited"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border text-white text-sm focus:outline-none focus:ring-2 placeholder-white/20 transition-all ${
                  errors.max_uses ? 'border-red-500 focus:ring-red-500' : 'border-[#22C55E]/10 focus:ring-[#22C55E]'
                }`}
              />
              {errors.max_uses && <p className="text-red-400 text-xs mt-1">{errors.max_uses}</p>}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <Clock className="w-4 h-4" />
                Valid From (optional)
              </label>
              <input 
                type="date"
                value={form.valid_from}
                onChange={e => setForm({ ...form, valid_from: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <Calendar className="w-4 h-4" />
              Valid Until (optional)
            </label>
            <input 
              type="date"
              value={form.valid_until}
              onChange={e => setForm({ ...form, valid_until: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
          </div>

          <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#051510] border border-[#22C55E]/10">
            <input 
              type="checkbox" 
              checked={form.is_active} 
              onChange={e => setForm({ ...form, is_active: e.target.checked })} 
              className="accent-[#22C55E] w-4 h-4"
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-white cursor-pointer">Active</label>
              <p className="text-xs text-white/40 hidden sm:block">Code can be used by customers</p>
            </div>
            {form.is_active && (
              <CheckCircle className="w-5 h-5 text-[#22C55E]" />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#22C55E]/10">
            <Button 
              type="button" 
              onClick={onClose} 
              className="flex-1 border-white/10 text-white/60 hover:bg-white/5 rounded-xl h-11 sm:h-12"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="flex-1 bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl h-11 sm:h-12 disabled:opacity-50"
            >
              {saving ? 'Saving...' : discountCode ? 'Update Code' : 'Create Code'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}