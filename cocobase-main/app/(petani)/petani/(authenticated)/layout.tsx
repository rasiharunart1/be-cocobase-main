import PetaniSideNav from "@/app/ui/petani/sidenav";
import PetaniTopBar from "@/app/ui/petani/topBar";

export default function AuthenticatedPetaniLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#F2F2F2] flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
                <PetaniSideNav />
            </div>
            <div className="flex-grow flex flex-col md:overflow-y-auto relative">
                <div className="fixed top-0 left-0 md:left-64 right-0 z-50">
                    <PetaniTopBar />
                </div>
                <div className="flex-grow p-4 md:p-8 pt-20 mt-5 text-[#202224]">
                    {children}
                </div>
            </div>
        </div>
    );
}
