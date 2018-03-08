module.exports = {
    devtool: "inline-source-map",
    entry: "./src/index.ts",
    output: {
        filename: "bundle.js"
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".js"]
    },
    module: {
        loaders: [
            { test: /\.ts?$/, loader: "ts-loader" }
        ]
    }
}
