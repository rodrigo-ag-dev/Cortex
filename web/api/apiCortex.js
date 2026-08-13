import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/eleicao/2014/presidente/primeiro-turno/estados'

const apiCortex = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
})

apiCortex.defaults.timeout = 120000

apiCortex.interceptors.response.use(response => {
  return response;
}, (error) => {
  return Promise.reject(error);
})

apiCortex.interceptors.request.use(request => {
  //Caso seja necessário implementar um controle de acesso a API
  //if (!request.headers || !request.headers.authorization) {
  //  const token = localStorage.getItem('token')
  //  request.headers.authorization = `Bearer ${token}`
  //}
  return request;
}, (error) => {
  return Promise.reject(error);
})

export default apiCortex