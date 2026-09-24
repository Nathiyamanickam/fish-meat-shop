const jwt = require("jsonwebtoken");

const initializeSocket = (io) => {
  // ==========================================
  // SOCKET AUTHENTICATION
  // ==========================================

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      console.log(
        "SOCKET TOKEN RECEIVED:",
        token ? "YES" : "NO"
      );

      if (!token) {
        return next(
          new Error(
            "Authentication required"
          )
        );
      }

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      console.log(
        "SOCKET USER:",
        decoded
      );

      socket.user = decoded;

      next();
    } catch (error) {
      console.error(
        "Socket authentication error:",
        error.message
      );

      next(
        new Error(
          "Invalid socket token"
        )
      );
    }
  });

  // ==========================================
  // CONNECTION
  // ==========================================

  io.on("connection", (socket) => {
    console.log(
      "SOCKET CONNECTED:",
      socket.id
    );

    const role =
      socket.user?.role;

    const phone =
      socket.user?.phone;

    // ========================================
    // ADMIN ROOM
    // ========================================

    if (role === "admin") {
      socket.join("admins");

      console.log(
        "ADMIN JOINED ROOM: admins"
      );
    }

    // ========================================
    // CUSTOMER ROOM
    // ========================================

    if (
      role === "customer" &&
      phone
    ) {
      socket.join(
        `customer:${phone}`
      );

      console.log(
        `CUSTOMER JOINED ROOM: customer:${phone}`
      );
    }

    // ========================================
    // DISCONNECT
    // ========================================

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "SOCKET DISCONNECTED:",
          socket.id,
          reason
        );
      }
    );
  });
};

module.exports =
  initializeSocket;