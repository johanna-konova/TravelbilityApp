import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

import { useLogin } from '../../hooks/use-auth';

import styles from './Auth-Forms.module.css';

export default function LoginForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginHandler } = useLogin();
    const [errorMessage, setErrorMessage] = useState(undefined);
    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        setErrorMessage(undefined);
        reset();
    }, [location.key]);

    async function login(userData) {
        try {
            await loginHandler(userData);
            navigate(-1);
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    return (
        <>
            <Container className="text-center mt-3">
                <h1 className="text-primary">
                    Log <span className="text-dark">in</span>
                </h1>
                <Row className={styles["auth-container"]}>
                    <Col lg={7}>
                        <Card className="border-0">
                            <Card.Header className={`${styles["auth-card-header"]} card-header p-5`} />
                            <Card.Body className="rounded-bottom bg-white p-5">
                                <Form className={styles["auth-form"]} onSubmit={handleSubmit(login)}>

                                    {errorMessage && <p className={styles["global-error-message"]}>{errorMessage}</p>}

                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="Ex.: john.doe@mail.com"
                                            {...register('email')}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="********"
                                            {...register('password')}
                                        />
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className={`${styles["submit-text"]} btn-block py-3`}>
                                        Log in
                                    </Button>
                                </Form>
                                <p className="text-center mt-3">
                                    New in Travelbility? <Link to="/register">Sign up now</Link>
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
};
