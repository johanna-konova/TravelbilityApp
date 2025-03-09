export default function Home() {
    return (
        <>
            {/* Carousel Start */}
            <div className="container-fluid p-0">
                <div id="header-carousel" className="carousel slide" data-ride="carousel">
                    <div className="carousel-inner">
                        <div className="carousel-item active">
                            <img className="w-100" src="img/carousel-1.jpg" alt="Image" />
                            <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
                                <div className="p-3" style={{ maxWidth: 900 }}>
                                    <h4 className="text-white text-uppercase mb-md-3">
                                        Tours &amp; Travel
                                    </h4>
                                    <h1 className="display-3 text-white mb-md-4">
                                        Let's Discover The World Together
                                    </h1>
                                    <a href="" className="btn btn-primary py-md-3 px-md-5 mt-2">
                                        Book Now
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="carousel-item">
                            <img className="w-100" src="img/carousel-2.jpg" alt="Image" />
                            <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
                                <div className="p-3" style={{ maxWidth: 900 }}>
                                    <h4 className="text-white text-uppercase mb-md-3">
                                        Tours &amp; Travel
                                    </h4>
                                    <h1 className="display-3 text-white mb-md-4">
                                        Discover Amazing Places With Us
                                    </h1>
                                    <a href="" className="btn btn-primary py-md-3 px-md-5 mt-2">
                                        Book Now
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <a
                        className="carousel-control-prev"
                        href="#header-carousel"
                        data-slide="prev"
                    >
                        <div className="btn btn-dark" style={{ width: 45, height: 45 }}>
                            <span className="carousel-control-prev-icon mb-n2" />
                        </div>
                    </a>
                    <a
                        className="carousel-control-next"
                        href="#header-carousel"
                        data-slide="next"
                    >
                        <div className="btn btn-dark" style={{ width: 45, height: 45 }}>
                            <span className="carousel-control-next-icon mb-n2" />
                        </div>
                    </a>
                </div>
            </div>
            {/* Carousel End */}

            {/* Booking Start */}
            <div className="container-fluid booking mt-5 pb-5">
                <div className="container pb-5">
                    <div className="bg-light shadow" style={{ padding: 30 }}>
                        <div className="row align-items-center" style={{ minHeight: 60 }}>
                            <div className="col-md-10">
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="mb-3 mb-md-0">
                                            <select className="custom-select px-4" style={{ height: 47 }}>
                                                <option selected="">Destination</option>
                                                <option defaultValue={1}>Destination 1</option>
                                                <option defaultValue={2}>Destination 1</option>
                                                <option defaultValue={3}>Destination 1</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="mb-3 mb-md-0">
                                            <div className="date" id="date1" data-target-input="nearest">
                                                <input
                                                    type="text"
                                                    className="form-control p-4 datetimepicker-input"
                                                    placeholder="Depart Date"
                                                    data-target="#date1"
                                                    data-toggle="datetimepicker"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="mb-3 mb-md-0">
                                            <div className="date" id="date2" data-target-input="nearest">
                                                <input
                                                    type="text"
                                                    className="form-control p-4 datetimepicker-input"
                                                    placeholder="Return Date"
                                                    data-target="#date2"
                                                    data-toggle="datetimepicker"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="mb-3 mb-md-0">
                                            <select className="custom-select px-4" style={{ height: 47 }}>
                                                <option selected="">Duration</option>
                                                <option defaultValue={1}>Duration 1</option>
                                                <option defaultValue={2}>Duration 1</option>
                                                <option defaultValue={3}>Duration 1</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-2">
                                <button
                                    className="btn btn-primary btn-block"
                                    type="submit"
                                    style={{ height: 47, marginTop: "-2px" }}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Booking End */}

            {/* Packages Start */}
            <div className="container-fluid py-5">
                <div className="container pt-5 pb-3">
                    <div className="text-center mb-3 pb-3">
                        <h6
                            className="text-primary text-uppercase"
                            style={{ letterSpacing: 5 }}
                        >
                            Packages
                        </h6>
                        <h1>Pefect Tour Packages</h1>
                    </div>
                    <div className="row">
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="package-item bg-white mb-2">
                                <img className="img-fluid" src="img/package-1.jpg" alt="" />
                                <div className="p-4">
                                    <div className="d-flex justify-content-between mb-3">
                                        <small className="m-0">
                                            <i className="fa fa-map-marker-alt text-primary mr-2" />
                                            Thailand
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-calendar-alt text-primary mr-2" />3 days
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-user text-primary mr-2" />2 Person
                                        </small>
                                    </div>
                                    <a className="h5 text-decoration-none" href="">
                                        Discover amazing places of the world with us
                                    </a>
                                    <div className="border-top mt-4 pt-4">
                                        <div className="d-flex justify-content-between">
                                            <h6 className="m-0">
                                                <i className="fa fa-star text-primary mr-2" />
                                                4.5 <small>(250)</small>
                                            </h6>
                                            <h5 className="m-0">$350</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="package-item bg-white mb-2">
                                <img className="img-fluid" src="img/package-2.jpg" alt="" />
                                <div className="p-4">
                                    <div className="d-flex justify-content-between mb-3">
                                        <small className="m-0">
                                            <i className="fa fa-map-marker-alt text-primary mr-2" />
                                            Thailand
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-calendar-alt text-primary mr-2" />3 days
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-user text-primary mr-2" />2 Person
                                        </small>
                                    </div>
                                    <a className="h5 text-decoration-none" href="">
                                        Discover amazing places of the world with us
                                    </a>
                                    <div className="border-top mt-4 pt-4">
                                        <div className="d-flex justify-content-between">
                                            <h6 className="m-0">
                                                <i className="fa fa-star text-primary mr-2" />
                                                4.5 <small>(250)</small>
                                            </h6>
                                            <h5 className="m-0">$350</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="package-item bg-white mb-2">
                                <img className="img-fluid" src="img/package-3.jpg" alt="" />
                                <div className="p-4">
                                    <div className="d-flex justify-content-between mb-3">
                                        <small className="m-0">
                                            <i className="fa fa-map-marker-alt text-primary mr-2" />
                                            Thailand
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-calendar-alt text-primary mr-2" />3 days
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-user text-primary mr-2" />2 Person
                                        </small>
                                    </div>
                                    <a className="h5 text-decoration-none" href="">
                                        Discover amazing places of the world with us
                                    </a>
                                    <div className="border-top mt-4 pt-4">
                                        <div className="d-flex justify-content-between">
                                            <h6 className="m-0">
                                                <i className="fa fa-star text-primary mr-2" />
                                                4.5 <small>(250)</small>
                                            </h6>
                                            <h5 className="m-0">$350</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="package-item bg-white mb-2">
                                <img className="img-fluid" src="img/package-4.jpg" alt="" />
                                <div className="p-4">
                                    <div className="d-flex justify-content-between mb-3">
                                        <small className="m-0">
                                            <i className="fa fa-map-marker-alt text-primary mr-2" />
                                            Thailand
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-calendar-alt text-primary mr-2" />3 days
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-user text-primary mr-2" />2 Person
                                        </small>
                                    </div>
                                    <a className="h5 text-decoration-none" href="">
                                        Discover amazing places of the world with us
                                    </a>
                                    <div className="border-top mt-4 pt-4">
                                        <div className="d-flex justify-content-between">
                                            <h6 className="m-0">
                                                <i className="fa fa-star text-primary mr-2" />
                                                4.5 <small>(250)</small>
                                            </h6>
                                            <h5 className="m-0">$350</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="package-item bg-white mb-2">
                                <img className="img-fluid" src="img/package-5.jpg" alt="" />
                                <div className="p-4">
                                    <div className="d-flex justify-content-between mb-3">
                                        <small className="m-0">
                                            <i className="fa fa-map-marker-alt text-primary mr-2" />
                                            Thailand
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-calendar-alt text-primary mr-2" />3 days
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-user text-primary mr-2" />2 Person
                                        </small>
                                    </div>
                                    <a className="h5 text-decoration-none" href="">
                                        Discover amazing places of the world with us
                                    </a>
                                    <div className="border-top mt-4 pt-4">
                                        <div className="d-flex justify-content-between">
                                            <h6 className="m-0">
                                                <i className="fa fa-star text-primary mr-2" />
                                                4.5 <small>(250)</small>
                                            </h6>
                                            <h5 className="m-0">$350</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="package-item bg-white mb-2">
                                <img className="img-fluid" src="img/package-6.jpg" alt="" />
                                <div className="p-4">
                                    <div className="d-flex justify-content-between mb-3">
                                        <small className="m-0">
                                            <i className="fa fa-map-marker-alt text-primary mr-2" />
                                            Thailand
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-calendar-alt text-primary mr-2" />3 days
                                        </small>
                                        <small className="m-0">
                                            <i className="fa fa-user text-primary mr-2" />2 Person
                                        </small>
                                    </div>
                                    <a className="h5 text-decoration-none" href="">
                                        Discover amazing places of the world with us
                                    </a>
                                    <div className="border-top mt-4 pt-4">
                                        <div className="d-flex justify-content-between">
                                            <h6 className="m-0">
                                                <i className="fa fa-star text-primary mr-2" />
                                                4.5 <small>(250)</small>
                                            </h6>
                                            <h5 className="m-0">$350</h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Packages End */}

            {/* Destination Start */}
            <div className="container-fluid py-5">
                <div className="container pt-5 pb-3">
                    <div className="text-center mb-3 pb-3">
                        <h6
                            className="text-primary text-uppercase"
                            style={{ letterSpacing: 5 }}
                        >
                            Destination
                        </h6>
                        <h1>Explore Top Destination</h1>
                    </div>
                    <div className="row">
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="destination-item position-relative overflow-hidden mb-2">
                                <img className="img-fluid" src="img/destination-1.jpg" alt="" />
                                <a
                                    className="destination-overlay text-white text-decoration-none"
                                    href=""
                                >
                                    <h5 className="text-white">United States</h5>
                                    <span>100 Cities</span>
                                </a>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="destination-item position-relative overflow-hidden mb-2">
                                <img className="img-fluid" src="img/destination-2.jpg" alt="" />
                                <a
                                    className="destination-overlay text-white text-decoration-none"
                                    href=""
                                >
                                    <h5 className="text-white">United Kingdom</h5>
                                    <span>100 Cities</span>
                                </a>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="destination-item position-relative overflow-hidden mb-2">
                                <img className="img-fluid" src="img/destination-3.jpg" alt="" />
                                <a
                                    className="destination-overlay text-white text-decoration-none"
                                    href=""
                                >
                                    <h5 className="text-white">Australia</h5>
                                    <span>100 Cities</span>
                                </a>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="destination-item position-relative overflow-hidden mb-2">
                                <img className="img-fluid" src="img/destination-4.jpg" alt="" />
                                <a
                                    className="destination-overlay text-white text-decoration-none"
                                    href=""
                                >
                                    <h5 className="text-white">India</h5>
                                    <span>100 Cities</span>
                                </a>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="destination-item position-relative overflow-hidden mb-2">
                                <img className="img-fluid" src="img/destination-5.jpg" alt="" />
                                <a
                                    className="destination-overlay text-white text-decoration-none"
                                    href=""
                                >
                                    <h5 className="text-white">South Africa</h5>
                                    <span>100 Cities</span>
                                </a>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="destination-item position-relative overflow-hidden mb-2">
                                <img className="img-fluid" src="img/destination-6.jpg" alt="" />
                                <a
                                    className="destination-overlay text-white text-decoration-none"
                                    href=""
                                >
                                    <h5 className="text-white">Indonesia</h5>
                                    <span>100 Cities</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Destination Start */}

            {/* Service Start */}
            <div className="container-fluid py-5">
                <div className="container pt-5 pb-3">
                    <div className="text-center mb-3 pb-3">
                        <h6
                            className="text-primary text-uppercase"
                            style={{ letterSpacing: 5 }}
                        >
                            Services
                        </h6>
                        <h1>Tours &amp; Travel Services</h1>
                    </div>
                    <div className="row">
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="service-item bg-white text-center mb-2 py-5 px-4">
                                <i className="fa fa-2x fa-route mx-auto mb-4" />
                                <h5 className="mb-2">Travel Guide</h5>
                                <p className="m-0">
                                    Justo sit justo eos amet tempor amet clita amet ipsum eos elitr.
                                    Amet lorem est amet labore
                                </p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="service-item bg-white text-center mb-2 py-5 px-4">
                                <i className="fa fa-2x fa-ticket-alt mx-auto mb-4" />
                                <h5 className="mb-2">Ticket Booking</h5>
                                <p className="m-0">
                                    Justo sit justo eos amet tempor amet clita amet ipsum eos elitr.
                                    Amet lorem est amet labore
                                </p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="service-item bg-white text-center mb-2 py-5 px-4">
                                <i className="fa fa-2x fa-hotel mx-auto mb-4" />
                                <h5 className="mb-2">Hotel Booking</h5>
                                <p className="m-0">
                                    Justo sit justo eos amet tempor amet clita amet ipsum eos elitr.
                                    Amet lorem est amet labore
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Service End */}
        </>
    )
};
