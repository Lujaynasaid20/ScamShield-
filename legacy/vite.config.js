export default {
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:3000"
    }
  }
};