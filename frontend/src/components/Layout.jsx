import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";


export default function Layout() {

  return (
    <div className="app-shell">

      <Sidebar />

      <main className="main-area">

        <Header />

        <section className="page-content">
          <Outlet />
        </section>

      </main>

    </div>
  );
}