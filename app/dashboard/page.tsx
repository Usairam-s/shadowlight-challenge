"use client";

import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { redirect, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Pencil,
  LogOut,
  ChevronDown,
  ChevronUp,
  Trash2,
  MessageCircle,
  X,
  Send,
} from "lucide-react";

const Page = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  // for todo list
  const [todo, setTodo] = useState("");
  const [description, setDescription] = useState("");
  const [todos, setTodos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSteps, setEditSteps] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  // for expandable steps
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // for chatbot
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ reusable function to fetch todos
  const fetchTodos = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });

      if (error) {
        toast.error("Error fetching todos: " + error.message);
        return;
      }

      setTodos(data || []);
    } catch (err) {
      console.error("Unexpected error fetching todos:", err);
    }
  };

  // add task
  const handleAddTask = async () => {
    if (todo.trim() === "") {
      toast.error("Task and description are required");
      return;
    }

    // call the n8n webhook url with title and description so we can some processing wit it
    const response = await fetch(
      "https://santa-app.app.n8n.cloud/webhook-test/7f9ab888-0bc4-4258-b05a-1ffdf1d2e415",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: todo, description }),
      }
    );

    const result = await response.json();
    const data = result[0];

    try {
      const { error } = await supabase.from("todos").insert([
        {
          title: data.enhancedTitle,
          description: data.enhancedDescription,
          steps: data.steps || [],
          completed: false,
          userId: user?.id,
        },
      ]);

      if (error) {
        toast.error("Error adding task: " + error.message);
        return;
      }

      toast.success("Task added!");
      setTodo("");
      setDescription("");

      // ✅ refresh list after insert
      if (user) fetchTodos(user.id);
    } catch (err) {
      toast.error("Unexpected error while adding task");
      console.error(err);
    }
  };

  // ✅ add task via chatbot
  const handleChatAddTask = async (taskTitle: string) => {
    if (taskTitle.trim() === "") {
      return;
    }

    setIsProcessing(true);

    // Add bot processing message
    setChatMessages((prev) => [
      ...prev,
      {
        type: "bot",
        message: "Processing your task... Please wait.",
        timestamp: new Date(),
      },
    ]);

    try {
      // call the n8n webhook url with title
      const response = await fetch(
        "https://santa-app.app.n8n.cloud/webhook-test/7f9ab888-0bc4-4258-b05a-1ffdf1d2e415",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: taskTitle, description: "" }),
        }
      );

      const result = await response.json();
      const data = result[0];

      // Insert into supabase
      const { error } = await supabase.from("todos").insert([
        {
          title: data.enhancedTitle,
          description: data.enhancedDescription,
          steps: data.steps || [],
          completed: false,
          userId: user?.id,
        },
      ]);

      if (error) {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "bot",
            message:
              "Sorry, there was an error adding your task. Please try again.",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // Success message
      setChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          message:
            "✅ Great! Your task has been added successfully. You can see it in your task list above.",
          timestamp: new Date(),
        },
      ]);

      // refresh list after insert
      if (user) fetchTodos(user.id);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          message:
            "Sorry, there was an error processing your task. Please try again.",
          timestamp: new Date(),
        },
      ]);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ handle chat submit
  const handleChatSubmit = async () => {
    if (chatInput.trim() === "" || isProcessing) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    // Add user message
    setChatMessages((prev) => [
      ...prev,
      {
        type: "user",
        message: userMessage,
        timestamp: new Date(),
      },
    ]);

    // Process the task
    await handleChatAddTask(userMessage);
  };

  // ✅ initialize chat
  const initializeChat = () => {
    setChatMessages([
      {
        type: "bot",
        message:
          "Hi! 👋 I can help you add tasks quickly. Just tell me what you want to do and I'll take care of the rest!",
        timestamp: new Date(),
      },
    ]);
  };

  // ✅ toggle chat
  const toggleChat = () => {
    if (!isChatOpen) {
      initializeChat();
    }
    setIsChatOpen(!isChatOpen);
  };

  // ✅ mark as completed
  const handleComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("todos")
        .update({ completed: true })
        .eq("id", id);

      if (error) {
        toast.error("Error marking task completed: " + error.message);
        return;
      }

      toast.success("Task marked as completed!");
      if (user) fetchTodos(user.id);
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  // ✅ edit todo
  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDescription(t.description);
    setEditSteps(t.steps || []);
  };

  // ✅ add a new step in edit mode
  const handleAddStep = () => {
    setEditSteps([...editSteps, ""]);
  };

  // ✅ update a step in edit mode
  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...editSteps];
    newSteps[index] = value;
    setEditSteps(newSteps);
  };

  // ✅ remove a step in edit mode
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

    // Filter out empty steps
    const nonEmptySteps = editSteps.filter((step) => step.trim() !== "");

    try {
      const { error } = await supabase
        .from("todos")
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
      if (user) fetchTodos(user.id);
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  // ✅ toggle steps visibility
  const toggleSteps = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user:", error);
        }

        if (user) {
          setUser(user);
          fetchTodos(user.id); // fetch todos for that user
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchTodos(session.user.id);
      } else {
        setTodos([]);
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Error signing out: " + error.message);
      } else {
        toast.success("Signed out successfully!");
        router.push("/"); // Redirect to home page
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    redirect("/");
  }

  // Filtered todos
  const filteredTodos = todos.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true; // all
  });

  // Logged in - show todos
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Logged in as:</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="outline"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Add New Task Section */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Add New Task
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <Input
                name="todo"
                value={todo}
                placeholder="Enter task title..."
                onChange={(e) => setTodo(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                name="description"
                value={description}
                placeholder="Enter task description..."
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[100px]"
              />
            </div>

            <Button onClick={handleAddTask} className="w-full" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Tasks List Section */}
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
                              {t.description}
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
                                <input
                                  type="checkbox"
                                  onChange={() => handleComplete(t.id)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </>
                            )}

                            {t.completed && (
                              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Steps section */}
                        {t.steps && t.steps.length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <button
                              onClick={() => toggleSteps(t.id)}
                              className="flex items-center text-sm font-semibold text-black  transition-colors"
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

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700"
          size="icon"
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Chat Interface */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 h-96 bg-white rounded-lg shadow-xl border flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Task Assistant</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="text-white hover:bg-blue-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tell me what you want to do..."
                className="flex-1"
                disabled={isProcessing}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleChatSubmit();
                  }
                }}
              />
              <Button
                onClick={handleChatSubmit}
                disabled={isProcessing || chatInput.trim() === ""}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
