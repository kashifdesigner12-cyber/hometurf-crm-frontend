import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F7F8FA]">
      <Sidebar />

      <div className="min-w-0 w-full md:ml-64 md:w-[calc(100%-16rem)]">
        <main className="page-enter min-w-0 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;