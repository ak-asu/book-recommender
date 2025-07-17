const BASE_URL = "YOUR_API_BASE_URL"; // Replace with your actual API base URL

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return response.json();
  },
};
