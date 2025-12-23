import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    // Hide navbar in individual chat rooms and toy details
    if (
        (location.pathname.startsWith('/sohbet/') && location.pathname.split('/').length > 2) ||
        location.pathname.startsWith('/oyuncak/')
    ) {
        return null;
    }

    const checkActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const NavLink = ({ to, icon, label, isAction = false }) => {
        const active = checkActive(to);

        if (isAction) {
            return (
                <Link to={to} className="flex flex-col items-center -mt-8">
                    <div className="bg-white p-3 rounded-full shadow-lg border-4 border-blue-600 scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-[10px] mt-1 font-bold text-white uppercase tracking-wider">{label}</span>
                </Link>
            );
        }

        return (
            <Link to={to} className="flex flex-col items-center flex-1">
                <div className={`p-2.5 rounded-full transition-all duration-300 ${active ? 'bg-white text-blue-600 shadow-md scale-110' : 'text-blue-100'}`}>
                    {icon}
                </div>
                <span className={`text-[10px] mt-0.5 font-medium transition-colors ${active ? 'text-white' : 'text-blue-200'}`}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-blue-600 py-2.5 pb-safe z-50 rounded-t-[24px] shadow-[0_-4px_20px_rgba(37,99,235,0.2)]">
            <div className="flex justify-around items-end px-2">
                <NavLink
                    to="/"
                    label="Ana Sayfa"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                />
                <NavLink
                    to="/sohbet"
                    label="Sohbet"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                />
                <NavLink
                    to="/ekle"
                    label="Ekle"
                    isAction={true}
                />
                <NavLink
                    to="/kiralamalarim"
                    label="Kiralık"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                />
                <NavLink
                    to="/profil"
                    label="Profil"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
            </div>
        </nav>
    );
}
