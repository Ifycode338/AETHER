import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon, Package as PackageIcon, DollarSign, Box, FileText, CheckCircle, Video as VideoIcon, Star, AlertTriangle, Search, Filter, Grid, List, ToggleLeft, ToggleRight, MoreVertical, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategorySelect from "@/components/admin/CategorySelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_date', { ascending: false })
      .limit(100);
    if (error) console.error('Error loading products:', error);
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "inactive" && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productToDelete);
      if (error) console.error('Error deleting product:', error);
      else load();
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    }
  };

  const openDeleteConfirm = (id) => {
    setProductToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const toggleProductSelection = (productId) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === filtered.length) {
      setSelectedProducts(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedProducts(new Set(filtered.map(p => p.id)));
      setShowBulkActions(true);
    }
  };

  const bulkUpdateStatus = async (isActive) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .in('id', Array.from(selectedProducts));
    
    if (error) console.error('Error bulk updating products:', error);
    else {
      load();
      setSelectedProducts(new Set());
      setShowBulkActions(false);
    }
  };

  const bulkDelete = async () => {
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', Array.from(selectedProducts));
    
    if (error) console.error('Error bulk deleting products:', error);
    else {
      load();
      setSelectedProducts(new Set());
      setShowBulkActions(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-white">Products</h1>
          <p className="text-sm text-white/40 mt-1">{products.length} products</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-[#22C55E]/20 text-[#22C55E]" : "text-white/30 hover:text-white"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#22C55E]/20 text-[#22C55E]" : "text-white/30 hover:text-white"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={openNew} className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl h-10 text-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-3 sm:p-4 mb-6 w-full">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap relative">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 text-sm rounded-xl border border-white/10 bg-[#051510] text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="supplements">Supplements</option>
                <option value="oral_care">Oral Care</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-10 text-sm rounded-xl border border-white/10 bg-[#051510] text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-3 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <span className="text-sm text-white">{selectedProducts.size} products selected</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => bulkUpdateStatus(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 transition-colors"
            >
              Activate
            </button>
            <button
              onClick={() => bulkUpdateStatus(false)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
            >
              Deactivate
            </button>
            <button
              onClick={bulkDelete}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#22C55E]/20 border-t-[#22C55E] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <PackageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No products found.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl overflow-hidden w-full">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-2 sm:space-y-3 p-3 sm:p-4 w-full">
            {filtered.map(product => (
              <div key={product.id} className="bg-[#051510] border border-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 w-full">
                <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="rounded border-white/20 bg-white/5 text-[#22C55E] focus:ring-[#22C55E] mt-1"
                  />
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-[#22C55E]/5 overflow-hidden flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10 font-bold text-sm">B</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                      <span className="text-white font-medium text-xs sm:text-sm truncate">{product.name}</span>
                      {product.is_featured && <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#22C55E] flex-shrink-0" />}
                    </div>
                    <span className="text-xs text-white/40 capitalize block">{product.category === "supplements" ? "Supplements" : "Oral Care"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-3 text-xs">
                  <div>
                    <span className="text-white/40 block text-xs">Price</span>
                    <span className="text-[#22C55E] font-medium text-xs">₦{product.price?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-xs">Stock</span>
                    <span className="text-white/70 text-xs">{product.stock || 0}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-xs">Status</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${
                      product.is_active 
                        ? "bg-[#22C55E]/10 text-[#22C55E]" 
                        : "bg-white/10 text-white/40"
                    }`}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <button onClick={() => openEdit(product)} className="flex-1 p-1.5 sm:p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-xs">
                    Edit
                  </button>
                  <button onClick={() => openDeleteConfirm(product.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#22C55E]/10">
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === filtered.length}
                      onChange={toggleAllProducts}
                      className="rounded border-white/20 bg-white/5 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="border-b border-[#22C55E]/5 hover:bg-[#22C55E]/5 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded border-white/20 bg-white/5 text-[#22C55E] focus:ring-[#22C55E]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#22C55E]/5 overflow-hidden flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10 font-bold text-xs">B</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate max-w-[200px]">{product.name}</span>
                          {product.is_featured && <Star className="w-4 h-4 text-[#22C55E]" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/50 capitalize">{product.category === "supplements" ? "Supplements" : "Oral Care"}</td>
                    <td className="px-6 py-4 text-[#22C55E] font-medium">₦{product.price?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-white/50">{product.stock || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        product.is_active 
                          ? "bg-[#22C55E]/10 text-[#22C55E]" 
                          : "bg-white/10 text-white/40"
                      }`}>
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(product)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDeleteConfirm(product.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-3 sm:p-4 overflow-hidden w-full">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 w-full max-w-full">
            {filtered.map(product => (
              <div key={product.id} className="bg-[#051510] border border-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col">
                <div className="aspect-square rounded-lg bg-[#22C55E]/5 overflow-hidden mb-2 sm:mb-3">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 font-bold text-xl sm:text-2xl">B</div>
                  )}
                </div>
                <div className="flex items-center gap-1 mb-1 sm:mb-2 min-h-[20px]">
                  <h3 className="font-medium text-white text-xs sm:text-sm truncate">{product.name}</h3>
                  {product.is_featured && <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#22C55E] flex-shrink-0" />}
                </div>
                <div className="flex justify-between items-center mb-2 sm:mb-3 text-xs">
                  <span className="text-[#22C55E] font-medium">₦{product.price?.toFixed(2)}</span>
                  <span className="text-white/30">Stock: {product.stock || 0}</span>
                </div>
                <div className="flex gap-1 sm:gap-2 mt-auto">
                  <button onClick={() => openEdit(product)} className="flex-1 p-1.5 sm:p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-xs">
                    Edit
                  </button>
                  <button onClick={() => openDeleteConfirm(product.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-[#071f15] border border-[#22C55E]/10 mx-4 sm:mx-auto max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-lg sm:text-xl">Delete Product?</DialogTitle>
            <DialogDescription className="text-white/60 text-sm sm:text-base">
              This action is permanent and cannot be undone. The product will be removed from your store.
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
              {deleting ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Package({ className }) {
  return <div className={className}>📦</div>;
}

function ProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    category: product?.category || "supplements",
    ingredients: product?.ingredients || "",
    benefits: product?.benefits || "",
    stock: product?.stock || 0,
    images: product?.images || [],
    video_url: product?.video_url || "",
    is_active: product?.is_active !== false,
    is_featured: product?.is_featured || false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Update form when product prop changes
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        category: product.category || "supplements",
        ingredients: product.ingredients || "",
        benefits: product.benefits || "",
        stock: product.stock || 0,
        images: product.images || [],
        video_url: product.video_url || "",
        is_active: product.is_active !== false,
        is_featured: product.is_featured || false,
      });
    }
  }, [product]);

  const handleImageUpload = async (files) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        return publicUrl;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      setForm(f => ({ ...f, images: [...f.images, ...uploadedUrls] }));
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload images. Please try again.');
    }
    setUploading(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    handleImageUpload(Array.from(e.target.files || []));
  };

  const handleRemoveImage = (index) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, i) => i !== index)
    }));
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    // Validate file size (1GB limit)
    if (file.size > 1024 * 1024 * 1024) {
      alert('Video size must be less than 1GB');
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `product-videos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-videos')
        .getPublicUrl(filePath);

      setForm(f => ({ ...f, video_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    }
    setUploadingVideo(false);
  };

  const handleRemoveVideo = () => {
    setForm(f => ({ ...f, video_url: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.price || parseFloat(form.price) <= 0) newErrors.price = 'Valid price is required';
    if (!form.stock || parseInt(form.stock) < 0) newErrors.stock = 'Valid stock is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (form.images.length === 0) newErrors.images = 'At least one image is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    
    // Prepare data, only include video_url if it exists
    const data = { 
      ...form, 
      price: parseFloat(form.price), 
      stock: parseInt(form.stock) 
    };
    
    // Remove video_url if empty to avoid database errors
    if (!data.video_url) {
      delete data.video_url;
    }
    
    try {
      if (product) {
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(data)
          .eq('id', product.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating product:', error);
          throw error;
        }
        
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(data)
          .select()
          .single();
        
        if (error) {
          console.error('Error creating product:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          });
          throw error;
        }
        
        console.log('Product created successfully:', newProduct);
      }
      onSaved();
    } catch (error) {
      alert(`Failed to save product: ${error.message || 'Please try again.'}`);
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
              <PackageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#22C55E]" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-white text-base sm:text-lg">{product ? "Edit Product" : "Add Product"}</h2>
              <p className="text-xs text-white/40 hidden sm:block">{product ? "Update product details" : "Create a new product"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <FileText className="w-4 h-4" />
                Product Name
              </label>
              <input 
                required 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Enter product name"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border text-white text-sm focus:outline-none focus:ring-2 placeholder-white/20 transition-all ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-[#22C55E]/10 focus:ring-[#22C55E]'
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <DollarSign className="w-4 h-4" />
                Price (₦)
              </label>
              <input 
                required 
                type="number" 
                step="0.01" 
                min="0" 
                value={form.price} 
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border text-white text-sm focus:outline-none focus:ring-2 placeholder-white/20 transition-all ${
                  errors.price ? 'border-red-500 focus:ring-red-500' : 'border-[#22C55E]/10 focus:ring-[#22C55E]'
                }`}
              />
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <Box className="w-4 h-4" />
                Stock
              </label>
              <input 
                type="number" 
                min="0" 
                value={form.stock} 
                onChange={e => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border text-white text-sm focus:outline-none focus:ring-2 placeholder-white/20 transition-all ${
                  errors.stock ? 'border-red-500 focus:ring-red-500' : 'border-[#22C55E]/10 focus:ring-[#22C55E]'
                }`}
              />
              {errors.stock && <p className="text-red-400 text-xs mt-1">{errors.stock}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
              <CategorySelect value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea 
              rows={4} 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your product..."
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border text-white text-sm focus:outline-none focus:ring-2 placeholder-white/20 resize-none transition-all ${
                errors.description ? 'border-red-500 focus:ring-red-500' : 'border-[#22C55E]/10 focus:ring-[#22C55E]'
              }`}
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <FileText className="w-4 h-4" />
              Ingredients
            </label>
            <textarea 
              rows={3} 
              value={form.ingredients} 
              onChange={e => setForm({ ...form, ingredients: e.target.value })}
              placeholder="List ingredients..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-white/20 resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <CheckCircle className="w-4 h-4" />
              Benefits
            </label>
            <textarea 
              rows={3} 
              value={form.benefits} 
              onChange={e => setForm({ ...form, benefits: e.target.value })}
              placeholder="List benefits..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#051510] border border-[#22C55E]/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder-white/20 resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <ImageIcon className="w-4 h-4" />
              Product Images
            </label>
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 mb-4">
                {form.images.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full rounded-xl object-cover border border-[#22C55E]/10" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all cursor-pointer ${
                dragActive 
                  ? 'border-[#22C55E] bg-[#22C55E]/5' 
                  : errors.images 
                    ? 'border-red-500 bg-red-500/5' 
                    : 'border-[#22C55E]/20 hover:border-[#22C55E]/40 hover:bg-[#22C55E]/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-white/40" />
              <p className="text-xs sm:text-sm text-white/60 mb-1">
                {uploading ? "Uploading images..." : "Drag & drop images here"}
              </p>
              <p className="text-xs text-white/40">or click to browse (multiple files supported)</p>
            </div>
            {errors.images && <p className="text-red-400 text-xs mt-1">{errors.images}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <VideoIcon className="w-4 h-4" />
              Product Video
            </label>
            {form.video_url ? (
              <div className="relative mb-4">
                <video 
                  src={form.video_url} 
                  controls 
                  className="w-full max-h-48 rounded-xl border border-[#22C55E]/10"
                />
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all cursor-pointer border-[#22C55E]/20 hover:border-[#22C55E]/40 hover:bg-[#22C55E]/5"
                onClick={() => videoInputRef.current?.click()}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                  className="hidden"
                />
                <VideoIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-white/40" />
                <p className="text-xs sm:text-sm text-white/60 mb-1">
                  {uploadingVideo ? "Uploading video..." : "Upload product video"}
                </p>
                <p className="text-xs text-white/40">Supports MP4, WebM, and other video formats (max 1GB)</p>
              </div>
            )}
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
              <p className="text-xs text-white/40 hidden sm:block">Product will be visible in store</p>
            </div>
            {form.is_active && (
              <CheckCircle className="w-5 h-5 text-[#22C55E]" />
            )}
          </div>

          <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-[#051510] border border-[#22C55E]/10">
            <input 
              type="checkbox" 
              checked={form.is_featured} 
              onChange={e => setForm({ ...form, is_featured: e.target.checked })} 
              className="accent-[#22C55E] w-4 h-4"
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-white cursor-pointer">Featured</label>
              <p className="text-xs text-white/40 hidden sm:block">Show in homepage featured section</p>
            </div>
            {form.is_featured && (
              <Star className="w-5 h-5 text-[#22C55E]" />
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
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#051510]/20 border-t-[#051510] rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                product ? "Update Product" : "Create Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}