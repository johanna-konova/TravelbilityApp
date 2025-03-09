import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

import { useCustomForm } from '../../hooks/use-custom-form';
import { registrationSchema } from '../../validations';
import { useRegister } from '../../hooks/use-auth';

import styles from './Auth-Forms.module.css';

export default function RegisterForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { registerHandler } = useRegister();
    const [errorMessage, setErrorMessage] = useState(undefined);
    const { register: registerInput, handleSubmit, reset, errors } = useCustomForm(registrationSchema);

    useEffect(() => {
        setErrorMessage(undefined);
        reset();
    }, [location.key]);

    async function register(userData) {
        try {
            await registerHandler(userData);
            navigate('/');
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <>
            <Container className="text-center mt-3">
                <h1 className="text-primary">
                    Sign <span className="text-dark">up</span>
                </h1>
                <Row className={styles["auth-container"]}>
                    <Col lg={7}>
                        <Card className="border-0">
                            <Card.Header className={`${styles["auth-card-header"]} card-header p-5`} />
                            <Card.Body className="rounded-bottom bg-white p-5">
                                <Form className={styles["auth-form"]} onSubmit={handleSubmit(register)}>
                                
                                    {errorMessage && <p className={styles["global-error-message"]}>{errorMessage}</p>}
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="Ex.: john.doe@mail.com"
                                            {...registerInput('email')}
                                        />
                                        {errors.email && <p className="text-danger">{errors.email.message}</p>}
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="********"
                                            {...registerInput('password')}
                                        />
                                        {errors.password && <p className="text-danger">{errors.password.message}</p>}
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Confirm Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="********"
                                            {...registerInput('confirmedPassword')}
                                        />
                                        {errors.confirmedPassword && <p className="text-danger">{errors.confirmedPassword.message}</p>}
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className={`${styles["submit-text"]} btn-block py-3`}>
                                        Sign up
                                    </Button>
                                </Form>
                                <p className="text-center mt-3">
                                    Already a member? <Link to="/login">Log in</Link>
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
};
