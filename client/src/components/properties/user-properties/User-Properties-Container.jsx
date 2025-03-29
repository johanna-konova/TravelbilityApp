import { Container, Row } from "react-bootstrap";

import PropertyShortGridView from "./Property-Short-Grid-View";

export default function UserPropertiesContainer({ propertiesDataByOwnerId }) {
    return (
        <>
            <Container>
                <Row className="justify-content-center">
                    {propertiesDataByOwnerId.map(pdboi =>
                        <PropertyShortGridView
                            key={pdboi._id}
                            propertyData={pdboi}
                        />)
                    }
                </Row>
            </Container>
        </>
    )
};
