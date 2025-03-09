import React from 'react';
import { Container, Row, Col, Image, Button, Card } from 'react-bootstrap';

export default function OurMission() {
    return (
        <>
            <Container fluid className="py-5">
                <Container className="pt-5">
                    <Row>
                        <Col lg={6} style={{ minHeight: 500 }}>
                            <div className="position-relative h-100">
                                <Image
                                    src="img/about.jpg"
                                    className="position-absolute w-100 h-100"
                                    style={{ objectFit: 'cover' }}
                                    alt="About"
                                    fluid
                                />
                            </div>
                        </Col>
                        <Col lg={6} className="pt-5 pb-lg-5">
                            <Card className="about-text bg-white p-4 p-lg-5 my-lg-5">
                                <Card.Body>
                                    <h6 className="text-primary text-uppercase" style={{ letterSpacing: 5 }}>
                                        About Us
                                    </h6>
                                    <Card.Title className="mb-3">
                                        We Provide Best Tour Packages In Your Budget
                                    </Card.Title>
                                    <Card.Text>
                                        Dolores lorem lorem ipsum sit et ipsum. Sadip sea amet diam dolore
                                        sed et. Sit rebum labore sit sit ut vero no sit. Et elitr stet
                                        dolor sed sit et sed ipsum et kasd ut. Erat duo eos et erat sed
                                        diam duo.
                                    </Card.Text>
                                    <Row className="mb-4">
                                        <Col xs={6}>
                                            <Image src="img/about-1.jpg" alt="About 1" fluid />
                                        </Col>
                                        <Col xs={6}>
                                            <Image src="img/about-2.jpg" alt="About 2" fluid />
                                        </Col>
                                    </Row>
                                    <Button variant="primary" className="mt-1">
                                        Book Now
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </Container>

            {/* Feature Start */}
            <Container fluid className="pb-5">
                <Container className="pb-5">
                    <Row className="pt-5">
                        {[
                            { icon: 'fa-money-check-alt', title: 'Competitive Pricing', text: 'Magna sit magna dolor duo dolor labore rebum amet elitr est diam sea' },
                            { icon: 'fa-award', title: 'Best Services', text: 'Magna sit magna dolor duo dolor labore rebum amet elitr est diam sea' },
                            { icon: 'fa-globe', title: 'Worldwide Coverage', text: 'Magna sit magna dolor duo dolor labore rebum amet elitr est diam sea' }
                        ].map((item, index) => (
                            <Col md={4} key={index} className="mb-4">
                                <div className="d-flex">
                                    <div
                                        className="d-flex flex-shrink-0 align-items-center justify-content-center bg-primary mr-3"
                                        style={{ height: 100, width: 100 }}
                                    >
                                        <i className={`fa fa-2x ${item.icon} text-white`}></i>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <h5>{item.title}</h5>
                                        <p className="m-0">{item.text}</p>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </Container>
            {/* Feature End */}
        </>
    )
};
