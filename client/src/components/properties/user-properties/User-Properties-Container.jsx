import { Container, Row } from "react-bootstrap";

import PropertyShortView from "./Property-Short-View";

export default function UserPropertiesContainer({ propertiesDataByOwnerId }) {
    return (
        <>
            <Container>
                <Row className="justify-content-center">
                    {propertiesDataByOwnerId.map(pdboi =>
                        <PropertyShortView
                            key={pdboi._id}
                            propertyData={pdboi}
                        />)
                    }
                </Row>
            </Container>
        </>
    )
};
