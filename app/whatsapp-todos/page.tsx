"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

const WhatsAppTodosPage = () => {
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSteps, setEditSteps] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ✅ reusable fetch
  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp-todos")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) {
        toast.error("Error fetching todos: " + error.message);
        return;
      }

      setTodos(data || []);
    } catch (err) {
      console.error("Unexpected error fetching todos:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ truncate helper
  const truncateWords = (text: string, maxWords: number) => {
    if (!text) return "";
    const parts = text.trim().split(/\s+/);
    if (parts.length <= maxWords) return text;
    return parts.slice(0, maxWords).join(" ") + "…";
  };

  // ✅ mark complete
  const handleComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("whatsapp-todos")
        .update({ completed: true })
        .eq("id", id);

      if (error) {
        toast.error("Error marking task completed: " + error.message);
        return;
      }

      toast.success("Task marked as completed!");
      fetchTodos();
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  // ✅ delete task
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("whatsapp-todos")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Error deleting task: " + error.message);
        return;
      }

      toast.success("Task deleted successfully!");
      fetchTodos();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // ✅ edit todo
  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDescription(t.description);
    setEditSteps(t.steps || []);
  };

  const handleAddStep = () => setEditSteps([...editSteps, ""]);

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...editSteps];
    newSteps[index] = value;
    setEditSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = [...editSteps];
    newSteps.splice(index, 1);
    setEditSteps(newSteps);
  };

  // ✅ save edited todo
  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim() === "" || editDescription.trim() === "") {
      toast.error("Title and description are required");
      return;
    }

    const nonEmptySteps = editSteps.filter((step) => step.trim() !== "");

    try {
      const { error } = await supabase
        .from("whatsapp-todos")
        .update({
          title: editTitle,
          description: editDescription,
          steps: nonEmptySteps,
        })
        .eq("id", id);

      if (error) {
        toast.error("Error updating task: " + error.message);
        return;
      }

      toast.success("Task updated!");
      setEditingId(null);
      fetchTodos();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  // ✅ toggle steps
  const toggleSteps = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  const filteredTodos = todos.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Tasks</h1>
          <p className="text-gray-600 mt-2">
            When you add tasks from WhatsApp, they will appear here.
          </p>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Tasks
              </h2>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                >
                  All ({todos.length})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "pending" ? "default" : "outline"}
                  onClick={() => setFilter("pending")}
                >
                  Pending ({todos.filter((t) => !t.completed).length})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "completed" ? "default" : "outline"}
                  onClick={() => setFilter("completed")}
                >
                  Completed ({todos.filter((t) => t.completed).length})
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredTodos.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No tasks found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTodos.map((t) => (
                  <div
                    key={t.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      t.completed ? "bg-gray-50/50" : ""
                    }`}
                  >
                    {editingId === t.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Title
                          </label>
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Task title"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Task description"
                            className="min-h-[80px]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Steps
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddStep}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Step
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {editSteps.map((step, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={step}
                                  onChange={(e) =>
                                    handleStepChange(index, e.target.value)
                                  }
                                  placeholder={`Step ${index + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveStep(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(t.id)}
                          >
                            Save Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <h3
                              className={`font-medium text-lg ${
                                t.completed
                                  ? "line-through text-gray-500"
                                  : "text-gray-900"
                              }`}
                            >
                              {t.title}
                            </h3>
                            <p
                              className={`text-gray-600 ${
                                t.completed ? "line-through" : ""
                              }`}
                            >
                              {expandedId === t.id
                                ? t.description
                                : truncateWords(t.description || "", 20)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            {!t.completed && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(t)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(t.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <input
                                  type="checkbox"
                                  onChange={() => handleComplete(t.id)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </>
                            )}

                            {t.completed && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                  Completed
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(t.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {t.steps && t.steps.length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <button
                              onClick={() => toggleSteps(t.id)}
                              className="flex items-center text-sm font-semibold text-black transition-colors"
                            >
                              {expandedId === t.id ? (
                                <ChevronUp className="h-4 w-4 mr-1" />
                              ) : (
                                <ChevronDown className="h-4 w-4 mr-1" />
                              )}
                              {expandedId === t.id
                                ? "Hide details"
                                : "Show more details"}
                            </button>

                            {expandedId === t.id && (
                              <div className="mt-3 pl-5 animate-in fade-in duration-300">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                  Steps:
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {t.steps.map(
                                    (step: string, index: number) => (
                                      <li
                                        key={index}
                                        className="p-1 bg-gray-50 rounded"
                                      >
                                        {step}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTodosPage;
