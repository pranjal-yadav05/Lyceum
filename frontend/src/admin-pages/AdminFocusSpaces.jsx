import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  Chip,
  Link,
} from "@mui/material";
import { Plus, Pencil, Trash2, LampDesk, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  glassPaperSx,
  glassDialogSx,
  glassAlertSx,
  fieldSx,
  selectSx,
  primaryBtnSx,
  secondaryBtnSx,
  tabSx,
  headCellSx,
  disabledRowSx,
} from "./adminFocusSpacesStyles";

const API = `${process.env.REACT_APP_API_URL}/admin/focus-spaces`;
const SOUNDS_API = `${process.env.REACT_APP_API_URL}/admin/focus-sounds`;

const emptyCategory = { label: "", sortOrder: 0, useSections: false, enabled: true };
const emptySection = { label: "", categoryId: "", sortOrder: 0, enabled: true };
const emptyEnvironment = {
  title: "",
  description: "",
  categoryId: "",
  section: "",
  sourceUrl: "",
  sortOrder: 0,
  enabled: true,
};
const emptySound = {
  title: "",
  description: "",
  categoryId: "",
  sourceUrl: "",
  icon: "🔊",
  defaultVolume: 50,
  sortOrder: 0,
  enabled: true,
};

function DialogButtons({ onCancel, onSave, saveLabel = "Save" }) {
  return (
    <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
      <Button onClick={onCancel} variant="contained" sx={{ ...secondaryBtnSx, flex: 1 }}>
        Cancel
      </Button>
      <Button onClick={onSave} variant="contained" sx={{ ...primaryBtnSx, flex: 1 }}>
        {saveLabel}
      </Button>
    </DialogActions>
  );
}

function ReorderButtons({ onUp, onDown, disableUp, disableDown }) {
  return (
    <Box sx={{ display: "inline-flex", flexDirection: "column", mr: 0.5 }}>
      <IconButton
        size="small"
        onClick={onUp}
        disabled={disableUp}
        sx={{ color: "#9ca3af", p: 0.25, "&:disabled": { opacity: 0.3 } }}
        title="Move up"
      >
        <ChevronUp size={14} />
      </IconButton>
      <IconButton
        size="small"
        onClick={onDown}
        disabled={disableDown}
        sx={{ color: "#9ca3af", p: 0.25, "&:disabled": { opacity: 0.3 } }}
        title="Move down"
      >
        <ChevronDown size={14} />
      </IconButton>
    </Box>
  );
}

function sortByOrderThenLabel(a, b, labelKey = "label") {
  return a.sortOrder - b.sortOrder || String(a[labelKey]).localeCompare(String(b[labelKey]));
}

export default function AdminFocusSpaces() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [sectionForm, setSectionForm] = useState(emptySection);
  const [envForm, setEnvForm] = useState(emptyEnvironment);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingEnvId, setEditingEnvId] = useState(null);
  const [sectionCategoryFilter, setSectionCategoryFilter] = useState("all");
  const [soundCategories, setSoundCategories] = useState([]);
  const [sounds, setSounds] = useState([]);
  const [soundCategoryForm, setSoundCategoryForm] = useState(emptyCategory);
  const [soundForm, setSoundForm] = useState(emptySound);
  const [soundCategoryDialogOpen, setSoundCategoryDialogOpen] = useState(false);
  const [soundDialogOpen, setSoundDialogOpen] = useState(false);
  const [editingSoundCategoryId, setEditingSoundCategoryId] = useState(null);
  const [editingSoundId, setEditingSoundId] = useState(null);

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const [catalogRes, soundsRes] = await Promise.all([
        axios.get(`${API}/catalog`),
        axios.get(`${SOUNDS_API}/catalog`),
      ]);
      setCategories(catalogRes.data.categories || []);
      setSections(catalogRes.data.sections || []);
      setEnvironments(catalogRes.data.environments || []);
      setSoundCategories(soundsRes.data.categories || []);
      setSounds(soundsRes.data.sounds || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load focus space catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const reorderItems = async (entity, items, id, direction) => {
    const sorted = [...items].sort((a, b) => sortByOrderThenLabel(a, b));
    const index = sorted.findIndex((item) => item._id === id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    try {
      await axios.post(`${API}/reorder`, {
        entity,
        ids: reordered.map((item) => item._id),
      });
      await loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reorder");
    }
  };

  const reorderSection = (sectionId, direction) => {
    const section = sections.find((s) => s._id === sectionId);
    if (!section) return;
    const categoryId = section.category?._id || section.category;
    const categorySections = sections
      .filter((s) => (s.category?._id || s.category) === categoryId)
      .sort((a, b) => sortByOrderThenLabel(a, b));
    reorderItems("sections", categorySections, sectionId, direction);
  };

  const openAddCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategory);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategoryId(cat._id);
    setCategoryForm({
      label: cat.label,
      sortOrder: cat.sortOrder,
      useSections: Boolean(cat.useSections),
      enabled: cat.enabled,
    });
    setCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    try {
      if (editingCategoryId) {
        await axios.patch(`${API}/categories/${editingCategoryId}`, categoryForm);
        toast.success("Category updated");
      } else {
        await axios.post(`${API}/categories`, categoryForm);
        toast.success("Category created");
      }
      setCategoryDialogOpen(false);
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save category");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await axios.delete(`${API}/categories/${id}`);
      toast.success("Category deleted");
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete category");
    }
  };

  const openAddSection = () => {
    const defaultCategory =
      sectionCategoryFilter !== "all"
        ? sectionCategoryFilter
        : categories.find((c) => c.enabled)?._id || categories[0]?._id || "";
    setEditingSectionId(null);
    setSectionForm({ ...emptySection, categoryId: defaultCategory });
    setSectionDialogOpen(true);
  };

  const openEditSection = (section) => {
    setEditingSectionId(section._id);
    setSectionForm({
      label: section.label,
      categoryId: section.category?._id || section.category,
      sortOrder: section.sortOrder,
      enabled: section.enabled,
    });
    setSectionDialogOpen(true);
  };

  const saveSection = async () => {
    try {
      if (editingSectionId) {
        await axios.patch(`${API}/sections/${editingSectionId}`, sectionForm);
        toast.success("Section updated");
      } else {
        await axios.post(`${API}/sections`, sectionForm);
        toast.success("Section created");
      }
      setSectionDialogOpen(false);
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save section");
    }
  };

  const deleteSection = async (id) => {
    if (!window.confirm("Delete this section?")) return;
    try {
      await axios.delete(`${API}/sections/${id}`);
      toast.success("Section deleted");
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete section");
    }
  };

  const openAddEnvironment = () => {
    setEditingEnvId(null);
    setEnvForm({
      ...emptyEnvironment,
      categoryId: categories.find((c) => c.enabled)?._id || categories[0]?._id || "",
    });
    setEnvDialogOpen(true);
  };

  const openEditEnvironment = (env) => {
    setEditingEnvId(env._id);
    setEnvForm({
      title: env.title,
      description: env.description || "",
      categoryId: env.category?._id || env.category,
      section: env.section || "",
      sourceUrl: env.sourceUrl,
      sortOrder: env.sortOrder,
      enabled: env.enabled,
    });
    setEnvDialogOpen(true);
  };

  const saveEnvironment = async () => {
    try {
      if (editingEnvId) {
        await axios.patch(`${API}/environments/${editingEnvId}`, envForm);
        toast.success("Environment updated");
      } else {
        await axios.post(`${API}/environments`, envForm);
        toast.success("Environment created");
      }
      setEnvDialogOpen(false);
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save environment");
    }
  };

  const deleteEnvironment = async (id) => {
    if (!window.confirm("Delete this environment?")) return;
    try {
      await axios.delete(`${API}/environments/${id}`);
      toast.success("Environment deleted");
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete environment");
    }
  };

  const openAddSoundCategory = () => {
    setEditingSoundCategoryId(null);
    setSoundCategoryForm(emptyCategory);
    setSoundCategoryDialogOpen(true);
  };

  const openEditSoundCategory = (cat) => {
    setEditingSoundCategoryId(cat._id);
    setSoundCategoryForm({
      label: cat.label,
      sortOrder: cat.sortOrder,
      enabled: cat.enabled,
    });
    setSoundCategoryDialogOpen(true);
  };

  const saveSoundCategory = async () => {
    try {
      if (editingSoundCategoryId) {
        await axios.patch(`${SOUNDS_API}/categories/${editingSoundCategoryId}`, soundCategoryForm);
        toast.success("Sound category updated");
      } else {
        await axios.post(`${SOUNDS_API}/categories`, soundCategoryForm);
        toast.success("Sound category created");
      }
      setSoundCategoryDialogOpen(false);
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save sound category");
    }
  };

  const deleteSoundCategory = async (id) => {
    if (!window.confirm("Delete this sound category?")) return;
    try {
      await axios.delete(`${SOUNDS_API}/categories/${id}`);
      toast.success("Sound category deleted");
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete sound category");
    }
  };

  const openAddSound = () => {
    setEditingSoundId(null);
    setSoundForm({
      ...emptySound,
      categoryId: soundCategories.find((c) => c.enabled)?._id || soundCategories[0]?._id || "",
    });
    setSoundDialogOpen(true);
  };

  const openEditSound = (sound) => {
    setEditingSoundId(sound._id);
    setSoundForm({
      title: sound.title,
      description: sound.description || "",
      categoryId: sound.category?._id || sound.category,
      sourceUrl: sound.sourceUrl,
      icon: sound.icon || "🔊",
      defaultVolume: sound.defaultVolume ?? 50,
      sortOrder: sound.sortOrder,
      enabled: sound.enabled,
    });
    setSoundDialogOpen(true);
  };

  const saveSound = async () => {
    try {
      if (editingSoundId) {
        await axios.patch(`${SOUNDS_API}/sounds/${editingSoundId}`, soundForm);
        toast.success("Sound updated");
      } else {
        await axios.post(`${SOUNDS_API}/sounds`, soundForm);
        toast.success("Sound created");
      }
      setSoundDialogOpen(false);
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save sound");
    }
  };

  const deleteSound = async (id) => {
    if (!window.confirm("Delete this sound?")) return;
    try {
      await axios.delete(`${SOUNDS_API}/sounds/${id}`);
      toast.success("Sound deleted");
      loadCatalog();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete sound");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <LoadingSpinner />
      </Box>
    );
  }

  const getSectionReorderState = (sectionId, list) => {
    const section = list.find((s) => s._id === sectionId);
    if (!section) return { disableUp: true, disableDown: true };
    const categoryId = section.category?._id || section.category;
    const categorySections = list.filter(
      (s) => (s.category?._id || s.category) === categoryId
    );
    const index = categorySections.findIndex((s) => s._id === sectionId);
    return {
      disableUp: index <= 0,
      disableDown: index < 0 || index >= categorySections.length - 1,
    };
  };

  const enabledCategories = categories.filter((c) => c.enabled);
  const sortedCategories = [...categories].sort((a, b) => sortByOrderThenLabel(a, b));
  const filteredSections = (
    sectionCategoryFilter === "all"
      ? sections
      : sections.filter((s) => (s.category?._id || s.category) === sectionCategoryFilter)
  ).sort((a, b) => sortByOrderThenLabel(a, b));
  const sortedEnvironments = [...environments].sort((a, b) => {
    const catA = a.category?.label || "";
    const catB = b.category?.label || "";
    return (
      catA.localeCompare(catB) ||
      (a.section || "").localeCompare(b.section || "") ||
      sortByOrderThenLabel(a, b, "title")
    );
  });

  const sectionsForCategory = (categoryId) =>
    sections
      .filter((s) => (s.category?._id || s.category) === categoryId && s.enabled)
      .sort((a, b) => sortByOrderThenLabel(a, b));

  const categoryUsesSections = (categoryId) =>
    Boolean(categories.find((c) => c._id === categoryId)?.useSections);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box
        sx={{
          ...glassPaperSx,
          p: 3,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(147,51,234,0.25)",
            border: "1px solid rgba(196,132,252,0.3)",
          }}
        >
          <LampDesk color="#c084fc" size={22} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
            Focus Spaces
          </Typography>
          <Typography variant="body2" sx={{ color: "#d1d5db", mt: 0.5 }}>
            Configure visual rooms and in-room sound layers for Solo Focus Spaces.
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={glassAlertSx}>
        <strong>Categories</strong> control the filter tabs. Enable{" "}
        <strong>section layout</strong> on a category to group its rooms under headings
        (like City / Waterfront). <strong>Sections</strong> belong to one category;{" "}
        <strong>visual rooms</strong> can be assigned to a section or left ungrouped.
        Use the arrows to reorder categories, sections, and rooms.
      </Alert>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={tabSx}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label={`Room categories (${categories.length})`} />
        <Tab label={`Sections (${sections.length})`} />
        <Tab label={`Visual rooms (${environments.length})`} />
        <Tab label={`Sound categories (${soundCategories.length})`} />
        <Tab label={`Sounds (${sounds.length})`} />
      </Tabs>

      {tab === 0 && (
        <Paper sx={glassPaperSx} elevation={0}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={openAddCategory}
              sx={primaryBtnSx}
            >
              Add category
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} width={48} />
                <TableCell sx={headCellSx}>Label</TableCell>
                <TableCell sx={headCellSx}>Slug</TableCell>
                <TableCell sx={headCellSx}>Layout</TableCell>
                <TableCell sx={headCellSx}>Order</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell sx={headCellSx} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedCategories.map((cat, index) => (
                <TableRow key={cat._id} sx={!cat.enabled ? disabledRowSx : undefined}>
                  <TableCell>
                    <ReorderButtons
                      onUp={() => reorderItems("categories", sortedCategories, cat._id, "up")}
                      onDown={() => reorderItems("categories", sortedCategories, cat._id, "down")}
                      disableUp={index === 0}
                      disableDown={index === sortedCategories.length - 1}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{cat.label}</TableCell>
                  <TableCell sx={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 12 }}>
                    {cat.slug}
                  </TableCell>
                  <TableCell sx={{ color: "#d1d5db" }}>
                    {cat.useSections ? "Sections" : "Grid"}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{cat.sortOrder}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={cat.enabled ? "Live" : "Hidden"}
                      sx={{
                        bgcolor: cat.enabled ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                        color: cat.enabled ? "#86efac" : "#d1d5db",
                        border: "1px solid",
                        borderColor: cat.enabled ? "rgba(34,197,94,0.35)" : "rgba(107,114,128,0.35)",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEditCategory(cat)} sx={{ color: "#c084fc" }}>
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton onClick={() => deleteCategory(cat._id)} sx={{ color: "#f87171" }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={glassPaperSx} elevation={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200, ...fieldSx }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={sectionCategoryFilter}
                label="Category"
                onChange={(e) => setSectionCategoryFilter(e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="all">All categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={openAddSection}
              disabled={enabledCategories.length === 0}
              sx={primaryBtnSx}
            >
              Add section
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} width={48} />
                <TableCell sx={headCellSx}>Label</TableCell>
                <TableCell sx={headCellSx}>Slug</TableCell>
                <TableCell sx={headCellSx}>Category</TableCell>
                <TableCell sx={headCellSx}>Order</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell sx={headCellSx} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSections.map((section) => {
                const { disableUp, disableDown } = getSectionReorderState(
                  section._id,
                  filteredSections
                );
                return (
                <TableRow key={section._id} sx={!section.enabled ? disabledRowSx : undefined}>
                  <TableCell>
                    <ReorderButtons
                      onUp={() => reorderSection(section._id, "up")}
                      onDown={() => reorderSection(section._id, "down")}
                      disableUp={disableUp}
                      disableDown={disableDown}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{section.label}</TableCell>
                  <TableCell sx={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 12 }}>
                    {section.slug}
                  </TableCell>
                  <TableCell sx={{ color: "#c084fc" }}>
                    {section.category?.label || "None"}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{section.sortOrder}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={section.enabled ? "Live" : "Hidden"}
                      sx={{
                        bgcolor: section.enabled ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                        color: section.enabled ? "#86efac" : "#d1d5db",
                        border: "1px solid",
                        borderColor: section.enabled ? "rgba(34,197,94,0.35)" : "rgba(107,114,128,0.35)",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEditSection(section)} sx={{ color: "#c084fc" }}>
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton onClick={() => deleteSection(section._id)} sx={{ color: "#f87171" }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={glassPaperSx} elevation={0}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={openAddEnvironment}
              disabled={enabledCategories.length === 0}
              sx={primaryBtnSx}
            >
              Add visual room
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx} width={48} />
                <TableCell sx={headCellSx}>Title</TableCell>
                <TableCell sx={headCellSx}>Category</TableCell>
                <TableCell sx={headCellSx}>Section</TableCell>
                <TableCell sx={headCellSx}>YouTube ID</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell sx={headCellSx} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEnvironments.map((env, index) => (
                <TableRow key={env._id} sx={!env.enabled ? disabledRowSx : undefined}>
                  <TableCell>
                    <ReorderButtons
                      onUp={() => reorderItems("environments", sortedEnvironments, env._id, "up")}
                      onDown={() => reorderItems("environments", sortedEnvironments, env._id, "down")}
                      disableUp={index === 0}
                      disableDown={index === sortedEnvironments.length - 1}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {env.title}
                    </Typography>
                    {env.description && (
                      <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 0.25 }}>
                        {env.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: "#c084fc" }}>
                    {env.category?.label || "None"}
                  </TableCell>
                  <TableCell sx={{ color: "#d1d5db" }}>
                    {env.section
                      ? sections.find((s) => s.slug === env.section)?.label || env.section
                      : "—"}
                  </TableCell>
                  <TableCell sx={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 11 }}>
                    {env.youtubeId}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={env.enabled ? "Live" : "Hidden"}
                      sx={{
                        bgcolor: env.enabled ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                        color: env.enabled ? "#86efac" : "#d1d5db",
                        border: "1px solid",
                        borderColor: env.enabled ? "rgba(34,197,94,0.35)" : "rgba(107,114,128,0.35)",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {env.enabled && env.slug && (
                      <IconButton
                        component={Link}
                        href={`/solo-study/${env.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: "#93c5fd" }}
                        title="Preview room"
                      >
                        <ExternalLink size={16} />
                      </IconButton>
                    )}
                    <IconButton onClick={() => openEditEnvironment(env)} sx={{ color: "#c084fc" }}>
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton onClick={() => deleteEnvironment(env._id)} sx={{ color: "#f87171" }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 3 && (
        <Paper sx={glassPaperSx} elevation={0}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={openAddSoundCategory}
              sx={primaryBtnSx}
            >
              Add sound category
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Label</TableCell>
                <TableCell sx={headCellSx}>Slug</TableCell>
                <TableCell sx={headCellSx}>Order</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell sx={headCellSx} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {soundCategories.map((cat) => (
                <TableRow key={cat._id} sx={!cat.enabled ? disabledRowSx : undefined}>
                  <TableCell sx={{ color: "white" }}>{cat.label}</TableCell>
                  <TableCell sx={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 12 }}>
                    {cat.slug}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{cat.sortOrder}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={cat.enabled ? "Live" : "Hidden"}
                      sx={{
                        bgcolor: cat.enabled ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                        color: cat.enabled ? "#86efac" : "#d1d5db",
                        border: "1px solid",
                        borderColor: cat.enabled ? "rgba(34,197,94,0.35)" : "rgba(107,114,128,0.35)",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEditSoundCategory(cat)} sx={{ color: "#c084fc" }}>
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton onClick={() => deleteSoundCategory(cat._id)} sx={{ color: "#f87171" }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 4 && (
        <Paper sx={glassPaperSx} elevation={0}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={openAddSound}
              disabled={soundCategories.filter((c) => c.enabled).length === 0}
              sx={primaryBtnSx}
            >
              Add sound
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Sound</TableCell>
                <TableCell sx={headCellSx}>Category</TableCell>
                <TableCell sx={headCellSx}>Default vol.</TableCell>
                <TableCell sx={headCellSx}>YouTube ID</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell sx={headCellSx} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sounds.map((sound) => (
                <TableRow key={sound._id} sx={!sound.enabled ? disabledRowSx : undefined}>
                  <TableCell sx={{ color: "white" }}>
                    <span className="mr-1.5">{sound.icon}</span>
                    {sound.title}
                  </TableCell>
                  <TableCell sx={{ color: "#c084fc" }}>{sound.category?.label || "None"}</TableCell>
                  <TableCell sx={{ color: "white" }}>{sound.defaultVolume}%</TableCell>
                  <TableCell sx={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 11 }}>
                    {sound.youtubeId}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={sound.enabled ? "Live" : "Hidden"}
                      sx={{
                        bgcolor: sound.enabled ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                        color: sound.enabled ? "#86efac" : "#d1d5db",
                        border: "1px solid",
                        borderColor: sound.enabled ? "rgba(34,197,94,0.35)" : "rgba(107,114,128,0.35)",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEditSound(sound)} sx={{ color: "#c084fc" }}>
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton onClick={() => deleteSound(sound._id)} sx={{ color: "#f87171" }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="xs" fullWidth sx={glassDialogSx}>
        <DialogTitle sx={{ color: "white", fontWeight: 600 }}>
          {editingCategoryId ? "Edit room category" : "Add room category"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Label"
            value={categoryForm.label}
            onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
            margin="normal"
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Sort order"
            type="number"
            value={categoryForm.sortOrder}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })
            }
            margin="normal"
            helperText="Lower numbers appear first in the catalog filter bar."
            sx={fieldSx}
          />
          <FormControlLabel
            control={
              <Switch
                checked={categoryForm.useSections}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, useSections: e.target.checked })
                }
                color="secondary"
              />
            }
            label="Use section layout (group rooms under headings)"
            sx={{ color: "white", mt: 1, display: "block" }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={categoryForm.enabled}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, enabled: e.target.checked })
                }
                color="secondary"
              />
            }
            label="Show in catalog"
            sx={{ color: "white" }}
          />
        </DialogContent>
        <DialogButtons onCancel={() => setCategoryDialogOpen(false)} onSave={saveCategory} />
      </Dialog>

      <Dialog open={sectionDialogOpen} onClose={() => setSectionDialogOpen(false)} maxWidth="xs" fullWidth sx={glassDialogSx}>
        <DialogTitle sx={{ color: "white", fontWeight: 600 }}>
          {editingSectionId ? "Edit section" : "Add section"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Label"
            value={sectionForm.label}
            onChange={(e) => setSectionForm({ ...sectionForm, label: e.target.value })}
            margin="normal"
            helperText="Shown as the heading above a group of rooms (e.g. City, Waterfront)."
            sx={fieldSx}
          />
          <FormControl fullWidth margin="normal" sx={fieldSx}>
            <InputLabel>Category</InputLabel>
            <Select
              value={sectionForm.categoryId}
              label="Category"
              onChange={(e) => setSectionForm({ ...sectionForm, categoryId: e.target.value })}
              sx={selectSx}
            >
              {categories
                .filter((c) => c.enabled || c._id === sectionForm.categoryId)
                .map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Sort order"
            type="number"
            value={sectionForm.sortOrder}
            onChange={(e) =>
              setSectionForm({ ...sectionForm, sortOrder: Number(e.target.value) })
            }
            margin="normal"
            sx={fieldSx}
          />
          <FormControlLabel
            control={
              <Switch
                checked={sectionForm.enabled}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, enabled: e.target.checked })
                }
                color="secondary"
              />
            }
            label="Show in catalog"
            sx={{ color: "white", mt: 1 }}
          />
        </DialogContent>
        <DialogButtons onCancel={() => setSectionDialogOpen(false)} onSave={saveSection} />
      </Dialog>

      <Dialog open={envDialogOpen} onClose={() => setEnvDialogOpen(false)} maxWidth="sm" fullWidth sx={glassDialogSx}>
        <DialogTitle sx={{ color: "white", fontWeight: 600 }}>
          {editingEnvId ? "Edit visual room" : "Add visual room"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={envForm.title}
            onChange={(e) => setEnvForm({ ...envForm, title: e.target.value })}
            margin="normal"
            helperText="Use the stream's real name. Users see this on the catalog card."
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={envForm.description}
            onChange={(e) => setEnvForm({ ...envForm, description: e.target.value })}
            margin="normal"
            helperText="Briefly describe what the video actually shows."
            sx={fieldSx}
          />
          <FormControl fullWidth margin="normal" sx={fieldSx}>
            <InputLabel>Category</InputLabel>
            <Select
              value={envForm.categoryId}
              label="Category"
              onChange={(e) =>
                setEnvForm({
                  ...envForm,
                  categoryId: e.target.value,
                  section: "",
                })
              }
              sx={selectSx}
            >
              {categories.filter((c) => c.enabled || c._id === envForm.categoryId).map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {categoryUsesSections(envForm.categoryId) && (
            <FormControl fullWidth margin="normal" sx={fieldSx}>
              <InputLabel>Section</InputLabel>
              <Select
                value={envForm.section}
                label="Section"
                onChange={(e) => setEnvForm({ ...envForm, section: e.target.value })}
                sx={selectSx}
              >
                <MenuItem value="">
                  <em>None (ungrouped)</em>
                </MenuItem>
                {sectionsForCategory(envForm.categoryId).map((section) => (
                  <MenuItem key={section._id} value={section.slug}>
                    {section.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            fullWidth
            label="YouTube URL or video ID"
            placeholder="https://youtu.be/… or https://www.youtube.com/live/…"
            value={envForm.sourceUrl}
            onChange={(e) => setEnvForm({ ...envForm, sourceUrl: e.target.value })}
            margin="normal"
            helperText="Must allow embedding on other sites. Preview the room after saving to confirm playback."
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Sort order"
            type="number"
            value={envForm.sortOrder}
            onChange={(e) =>
              setEnvForm({ ...envForm, sortOrder: Number(e.target.value) })
            }
            margin="normal"
            sx={fieldSx}
          />
          <FormControlLabel
            control={
              <Switch
                checked={envForm.enabled}
                onChange={(e) => setEnvForm({ ...envForm, enabled: e.target.checked })}
                color="secondary"
              />
            }
            label="Show in catalog"
            sx={{ color: "white" }}
          />
        </DialogContent>
        <DialogButtons onCancel={() => setEnvDialogOpen(false)} onSave={saveEnvironment} />
      </Dialog>

      <Dialog open={soundCategoryDialogOpen} onClose={() => setSoundCategoryDialogOpen(false)} maxWidth="xs" fullWidth sx={glassDialogSx}>
        <DialogTitle sx={{ color: "white", fontWeight: 600 }}>
          {editingSoundCategoryId ? "Edit sound category" : "Add sound category"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Label"
            value={soundCategoryForm.label}
            onChange={(e) => setSoundCategoryForm({ ...soundCategoryForm, label: e.target.value })}
            margin="normal"
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Sort order"
            type="number"
            value={soundCategoryForm.sortOrder}
            onChange={(e) =>
              setSoundCategoryForm({ ...soundCategoryForm, sortOrder: Number(e.target.value) })
            }
            margin="normal"
            sx={fieldSx}
          />
          <FormControlLabel
            control={
              <Switch
                checked={soundCategoryForm.enabled}
                onChange={(e) =>
                  setSoundCategoryForm({ ...soundCategoryForm, enabled: e.target.checked })
                }
                color="secondary"
              />
            }
            label="Show in sound mixer"
            sx={{ color: "white", mt: 1 }}
          />
        </DialogContent>
        <DialogButtons onCancel={() => setSoundCategoryDialogOpen(false)} onSave={saveSoundCategory} />
      </Dialog>

      <Dialog open={soundDialogOpen} onClose={() => setSoundDialogOpen(false)} maxWidth="sm" fullWidth sx={glassDialogSx}>
        <DialogTitle sx={{ color: "white", fontWeight: 600 }}>
          {editingSoundId ? "Edit sound" : "Add sound"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={soundForm.title}
            onChange={(e) => setSoundForm({ ...soundForm, title: e.target.value })}
            margin="normal"
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={soundForm.description}
            onChange={(e) => setSoundForm({ ...soundForm, description: e.target.value })}
            margin="normal"
            sx={fieldSx}
          />
          <FormControl fullWidth margin="normal" sx={fieldSx}>
            <InputLabel>Category</InputLabel>
            <Select
              value={soundForm.categoryId}
              label="Category"
              onChange={(e) => setSoundForm({ ...soundForm, categoryId: e.target.value })}
              sx={selectSx}
            >
              {soundCategories
                .filter((c) => c.enabled || c._id === soundForm.categoryId)
                .map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="YouTube URL"
            placeholder="https://www.youtube.com/live/…"
            value={soundForm.sourceUrl}
            onChange={(e) => setSoundForm({ ...soundForm, sourceUrl: e.target.value })}
            margin="normal"
            helperText="Audio-only layer played in the room mixer, not as a full-screen background."
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Icon (emoji)"
            value={soundForm.icon}
            onChange={(e) => setSoundForm({ ...soundForm, icon: e.target.value })}
            margin="normal"
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Default volume (0-100)"
            type="number"
            value={soundForm.defaultVolume}
            onChange={(e) =>
              setSoundForm({ ...soundForm, defaultVolume: Number(e.target.value) })
            }
            margin="normal"
            inputProps={{ min: 0, max: 100 }}
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Sort order"
            type="number"
            value={soundForm.sortOrder}
            onChange={(e) =>
              setSoundForm({ ...soundForm, sortOrder: Number(e.target.value) })
            }
            margin="normal"
            sx={fieldSx}
          />
          <FormControlLabel
            control={
              <Switch
                checked={soundForm.enabled}
                onChange={(e) => setSoundForm({ ...soundForm, enabled: e.target.checked })}
                color="secondary"
              />
            }
            label="Show in sound mixer"
            sx={{ color: "white" }}
          />
        </DialogContent>
        <DialogButtons onCancel={() => setSoundDialogOpen(false)} onSave={saveSound} />
      </Dialog>
    </Container>
  );
}
