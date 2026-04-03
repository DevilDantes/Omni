const API = {
  // ATENCIÓN: Esta URL debe apuntar a tu n8n local o Cloud.
  BASE_URL: 'http://localhost:3000/api', 

  // Enviar datos a n8n (Guardar)
  post: async (endpoint, data) => {
    try {
      const response = await fetch(`${API.BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Error HTTP: ' + response.status);
      return await response.json();
    } catch (error) {
      console.error(`Error POST a ${endpoint}:`, error);
      throw error;
    }
  },

  // Obtener datos de n8n (Leer)
  get: async (endpoint) => {
  try {
    const url = `${API.BASE_URL}/${endpoint}`;
    console.log("Llamando a:", url); // <-- para debug

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error("Error HTTP:", response.status);
      throw new Error('Error HTTP: ' + response.status);
    }

    const data = await response.json();
    console.log("Respuesta:", data); // <-- para ver si llegan datos

    return data;

  } catch (error) {
    console.error(`Error GET a ${endpoint}:`, error);
    return [];
  }
  
}
};