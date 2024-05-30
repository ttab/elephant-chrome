// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "file:///home/gvl/dev/elephant-chrome/node_modules/vite/dist/node/index.js";
import react from "file:///home/gvl/dev/elephant-chrome/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { viteStaticCopy } from "file:///home/gvl/dev/elephant-chrome/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "/home/gvl/dev/elephant-chrome";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyPath = `${env.BASE_URL || ""}/api`;
  return {
    base: "/elephant",
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: "./node_modules/@ttab/elephant-ui/dist/styles/**/*.{woff,woff2}",
            dest: "./assets"
          }
        ]
      })
    ],
    resolve: {
      alias: {
        "@/components": path.resolve(__vite_injected_original_dirname, "./src/components"),
        "@/views": path.resolve(__vite_injected_original_dirname, "./src/views"),
        "@/hooks": path.resolve(__vite_injected_original_dirname, "./src/hooks"),
        "@/contexts": path.resolve(__vite_injected_original_dirname, "./src/contexts"),
        "@/lib": path.resolve(__vite_injected_original_dirname, "./src/lib"),
        "@/types": path.resolve(__vite_injected_original_dirname, "./src/types"),
        "@/navigation": path.resolve(__vite_injected_original_dirname, "./src/navigation"),
        "@/defaults": path.resolve(__vite_injected_original_dirname, "./src/defaults"),
        "@/protos": path.resolve(__vite_injected_original_dirname, "./shared/protos"),
        "@/shared": path.resolve(__vite_injected_original_dirname, "./shared")
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        [proxyPath]: {
          target: `http://${env.HOST}:${env.PORT}`,
          changeOrigin: true,
          secure: false
        }
      },
      cors: { origin: "*" }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9ndmwvZGV2L2VsZXBoYW50LWNocm9tZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvZ3ZsL2Rldi9lbGVwaGFudC1jaHJvbWUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvZ3ZsL2Rldi9lbGVwaGFudC1jaHJvbWUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSAndml0ZS1wbHVnaW4tc3RhdGljLWNvcHknXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJylcbiAgY29uc3QgcHJveHlQYXRoID0gYCR7ZW52LkJBU0VfVVJMIHx8ICcnfS9hcGlgXG4gIHJldHVybiB7XG4gICAgYmFzZTogJy9lbGVwaGFudCcsXG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgICAgdGFyZ2V0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy4vbm9kZV9tb2R1bGVzL0B0dGFiL2VsZXBoYW50LXVpL2Rpc3Qvc3R5bGVzLyoqLyoue3dvZmYsd29mZjJ9JyxcbiAgICAgICAgICAgIGRlc3Q6ICcuL2Fzc2V0cydcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQC9jb21wb25lbnRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2NvbXBvbmVudHMnKSxcbiAgICAgICAgJ0Avdmlld3MnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvdmlld3MnKSxcbiAgICAgICAgJ0AvaG9va3MnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvaG9va3MnKSxcbiAgICAgICAgJ0AvY29udGV4dHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29udGV4dHMnKSxcbiAgICAgICAgJ0AvbGliJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2xpYicpLFxuICAgICAgICAnQC90eXBlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy90eXBlcycpLFxuICAgICAgICAnQC9uYXZpZ2F0aW9uJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL25hdmlnYXRpb24nKSxcbiAgICAgICAgJ0AvZGVmYXVsdHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvZGVmYXVsdHMnKSxcbiAgICAgICAgJ0AvcHJvdG9zJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc2hhcmVkL3Byb3RvcycpLFxuICAgICAgICAnQC9zaGFyZWQnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zaGFyZWQnKVxuICAgICAgfVxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiA1MTczLFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgIFtwcm94eVBhdGhdOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgaHR0cDovLyR7ZW52LkhPU1R9OiR7ZW52LlBPUlR9YCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY29yczogeyBvcmlnaW46ICcqJyB9XG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5USxPQUFPLFVBQVU7QUFDMVIsU0FBUyxjQUFjLGVBQWU7QUFDdEMsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsc0JBQXNCO0FBSC9CLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksRUFBRTtBQUN2QyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixlQUFlO0FBQUEsUUFDYixTQUFTO0FBQUEsVUFDUDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsTUFBTTtBQUFBLFVBQ1I7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsZ0JBQWdCLEtBQUssUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQSxRQUMxRCxXQUFXLEtBQUssUUFBUSxrQ0FBVyxhQUFhO0FBQUEsUUFDaEQsV0FBVyxLQUFLLFFBQVEsa0NBQVcsYUFBYTtBQUFBLFFBQ2hELGNBQWMsS0FBSyxRQUFRLGtDQUFXLGdCQUFnQjtBQUFBLFFBQ3RELFNBQVMsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxRQUM1QyxXQUFXLEtBQUssUUFBUSxrQ0FBVyxhQUFhO0FBQUEsUUFDaEQsZ0JBQWdCLEtBQUssUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQSxRQUMxRCxjQUFjLEtBQUssUUFBUSxrQ0FBVyxnQkFBZ0I7QUFBQSxRQUN0RCxZQUFZLEtBQUssUUFBUSxrQ0FBVyxpQkFBaUI7QUFBQSxRQUNyRCxZQUFZLEtBQUssUUFBUSxrQ0FBVyxVQUFVO0FBQUEsTUFDaEQ7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixPQUFPO0FBQUEsUUFDTCxDQUFDLFNBQVMsR0FBRztBQUFBLFVBQ1gsUUFBUSxVQUFVLElBQUksSUFBSSxJQUFJLElBQUksSUFBSTtBQUFBLFVBQ3RDLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsTUFDRjtBQUFBLE1BQ0EsTUFBTSxFQUFFLFFBQVEsSUFBSTtBQUFBLElBQ3RCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
