import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/Auth-Context";
import { useLogout } from "../hooks/use-auth";

export default function Topbar() {
    const { isAuthenticated } = useAuthContext();
    const { logoutHandler } = useLogout();
    const navigate = useNavigate();

    async function logout() {
        // TODO: try-catch and the show error message
        await logoutHandler();
        navigate('/');
    }

    return (
        <>
            <div className="container-fluid bg-light pt-3 d-none d-lg-block">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6 text-center text-lg-left mb-2 mb-lg-0">
                            <div className="d-inline-flex align-items-center">
                                {isAuthenticated
                                    ? <>
                                        <Link to="/my-properties" type="button" className="btn btn-outline-success">Manage my properties</Link>
                                        <Link type="button" className="btn btn-outline-success" onClick={logout}>Sign out</Link>
                                    </>
                                    : <>
                                        <Link to="/register" type="button" className="btn btn-outline-success">Sign up</Link>
                                        <Link to="/login" type="Link" className="btn btn-outline-success">Log in</Link>
                                    </>
                                }
                            </div>
                        </div>
                        <div className="col-lg-6 text-center text-lg-right">
                            <div className="d-inline-flex align-items-center">
                                <Link to="/list" type="button" className="btn btn-link">List your property</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};