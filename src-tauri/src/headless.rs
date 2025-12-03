use clap::Parser;
use zenus_lib::*;

#[derive(Parser, Debug)]
#[command(version, about = "Zenus Server - Headless note server", long_about = None)]
struct Args {
    /// Host to bind the server to
    #[arg(long, default_value = "0.0.0.0")]
    host: String,

    /// Port to bind to
    #[arg(long, default_value_t = 8888)]
    port: u16,

    /// Authentication token/password
    #[arg(long)]
    auth: Option<String>,

    /// Custom path for notes directory
    #[arg(long)]
    path: Option<String>,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    run_server(args.host, args.port, args.auth, args.path).await;
}
