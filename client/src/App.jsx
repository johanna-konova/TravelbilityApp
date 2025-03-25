import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AuthContextProvider from "./contexts/Auth-Context";
import PropertyContextProvider from "./contexts/Property-Context";
import AuthGuard from "./components/common/Auth-Guard";

import Topbar from "./components/Topbar";
import Navbar from "./components/Navbar";
import Home from "./components/home/Home";
import LoginForm from "./components/auth-forms/Login-Form";
import RegisterForm from "./components/auth-forms/Register-Form";
import AllProperties from "./components/properties/all-properties/All-Properties";
import OurMission from "./components/our-mission/Our-Mission";
import PropertyDetailsContainer from "./components/property/property-details/Property-Details-Container";
import UserProperties from "./components/properties/user-properties/User-Properties";
import PropertyCreateEditForm from "./components/property/property-create-edit/Property-Create-Edit-Form";
import Footer from "./components/Footer";
import BackToTop from "./components/Back-To-Top";
import PublisherGuard from "./components/common/Publisher-Guard";
import NotFound from "./components/not-found/Not-Found";

function App() {
    return (
        <>
            <AuthContextProvider>
                <Toaster />

                <Topbar />

                <Navbar />

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />

                    <Route path="/properties" element={<AllProperties />} />
                    <Route path="/our-mission" element={<OurMission />} />

                    <Route path="/properties/:propertyId" element={
                        <PropertyContextProvider>
                            <PropertyDetailsContainer />
                        </PropertyContextProvider>
                    } />

                    <Route element={<AuthGuard />}>
                        <Route path="/list" element={<PropertyCreateEditForm />} />

                        <Route path="/edit/:propertyId" element={
                            <PropertyContextProvider>
                                <PublisherGuard>
                                    <PropertyCreateEditForm />
                                </PublisherGuard>
                            </PropertyContextProvider>
                        } />

                        <Route path="/my-properties" element={<UserProperties />} />
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />

                </Routes>

                <Footer />

                <BackToTop />
            </AuthContextProvider>
        </>
    )
}

export default App
