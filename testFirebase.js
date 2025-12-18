import db from "./firebase.js";

async function pruebaFirebase() {
  try {
    await db.ref("prueba_render").set({
      mensaje: "Render conectado con Firebase correctamente",
      timestamp: Date.now()
    });

    console.log("✅ ESCRITURA EXITOSA EN FIREBASE");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR ESCRIBIENDO EN FIREBASE");
    console.error(error);
    process.exit(1);
  }
}

pruebaFirebase();
