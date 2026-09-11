// ============================================================
      // LOAD USER PROFILE
      // ============================================================
      async function loadUserProfile(userId) {
        if (!supabase) throw new Error("Supabase belum dikonfigurasi");

        const { data, error } = await supabase
          .from("pengguna")
          .select("id, user_id, nama, email, role")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Profile error:", error);
          throw new Error("Profil pengguna tidak ditemukan atau tidak dapat diakses.");
        }
        if (!data) throw new Error("Profil pengguna tidak ditemukan.");

        return data;
      }

// ============================================================
      // LOGIN UI
      // ============================================================
      function renderLoginPage() {
        return `
          <div class="login-container">
            <div class="login-box">
              <div class="login-header">
                <div class="login-logo">🎒</div>
                <div class="login-brand">
                  <h1>Gantariku</h1>
                  <p>Absensi &amp; SPP</p>
                </div>
              </div>

              <div class="error-msg" id="loginError"></div>

              <form class="login-form" id="loginForm">
                <div class="form-group">
                  <label for="email">Email</label>
                  <input type="email" id="email" placeholder="nama@sekolah.id" required>
                </div>

                <div class="form-group">
                  <label for="password">Password</label>
                  <input type="password" id="password" placeholder="••••••••" required>
                </div>

                <button type="submit" class="login-btn" id="loginBtn">
                  <span id="loginBtnText">Masuk</span>
                </button>
              </form>
            </div>
          </div>
        `;
      }

      function renderLogin() {
        document.getElementById("app").innerHTML = renderLoginPage();
        document.getElementById("loginForm").addEventListener("submit", handleLogin);
      }

// ============================================================
      // LOGIN HANDLER
      // ============================================================
      async function handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const errorEl = document.getElementById("loginError");
        const btnEl = document.getElementById("loginBtn");
        const btnText = document.getElementById("loginBtnText");

        errorEl.textContent = "";
        errorEl.classList.remove("show");

        if (!email || !password) {
          errorEl.textContent = "Email dan password harus diisi.";
          errorEl.classList.add("show");
          return;
        }

        btnEl.disabled = true;
        btnText.innerHTML = '<span class="loading-spinner"></span>Memproses...';

        try {
          if (!supabase) throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu muat ulang halaman.");

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw new Error("Email atau password salah.");
          if (!authData.user) throw new Error("User tidak ditemukan.");

          const profile = await loadUserProfile(authData.user.id);

          currentUser = profile;
          currentUserRole = profile.role;
          currentNav = NAV_CONFIG[currentUserRole]?.[0]?.id || "dasbor";

          renderApp();
        } catch (error) {
          console.error("Login error:", error);
          if (supabase) await supabase.auth.signOut();
          errorEl.textContent = error.message || "Terjadi kesalahan saat login.";
          errorEl.classList.add("show");
        } finally {
          btnEl.disabled = false;
          btnText.textContent = "Masuk";
        }
      }

      async function logout() {
        try {
          if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) console.error("Logout error:", error);
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
      stopRealtimeNotifications();
      
          currentUser = null;
          currentUserRole = null;
          currentNav = "dasbor";
          anakOrangTuaList = [];
          anakTerpilihId = null;
          renderLogin();
        }
      }
