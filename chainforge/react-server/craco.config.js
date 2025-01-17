const webpack = require("webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = {
  eslint: {
    enable: false,
  },
  webpack: {
    configure: (webpackConfig, { env }) => {
      webpackConfig.entry = ["./src/index.js"];
      webpackConfig.output = {
        ...webpackConfig.output,
        publicPath: "auto",
      };

      webpackConfig.plugins.push(
        new ModuleFederationPlugin({
          name: "chainforge",
          filename: "remoteEntry.js",
          exposes: {
            "./App": "./src/bootstrap",
          },
          shared: {
            ...deps,
            react: {
              singleton: true,
              requiredVersion: deps.react,
              eager: false,
            },
            "react-dom": {
              singleton: true,
              requiredVersion: deps["react-dom"],
              eager: false,
            },
          },
        }),
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        }),
      );

      // Add resolve fallbacks
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          ...webpackConfig.resolve.fallback,
          process: require.resolve("process/browser"),
          buffer: require.resolve("buffer"),
          https: require.resolve("https-browserify"),
          querystring: require.resolve("querystring-es3"),
          url: require.resolve("url/"),
          os: require.resolve("os-browserify/browser"),
          stream: require.resolve("stream-browserify"),
          path: require.resolve("path-browserify"),
          util: require.resolve("util/"),
          crypto: require.resolve("crypto-browserify"),
          assert: require.resolve("assert/"),
          http: require.resolve("stream-http"),
          net: require.resolve("net-browserify"),
          zlib: require.resolve("browserify-zlib"),
          fs: false,
          child_process: false,
        },
      };

      return webpackConfig;
    },
  },
  devServer: {
    port: 3000,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, content-type, Authorization",
    },
  },
};
