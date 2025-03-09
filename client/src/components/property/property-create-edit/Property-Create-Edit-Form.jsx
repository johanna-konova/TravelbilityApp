import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Container, Form } from 'react-bootstrap';
import toast from "react-hot-toast";

import { useBasicGetFetch } from '../../../hooks/use-basic-get-fetch';
import * as propertyAPI from '../../../services/propertiesServices';
import { usePropertyContext } from '../../../contexts/Property-Context';
import { propertySchema } from '../../../validations';

import PropertyCreateEditFormStepOne from './Property-Create-Edit-Form-Step-One';
import PropertyCreateEditFormStepTwo from './Property-Create-Edit-Form-Step-Two';
import PropertyCreateEditFormStepThree from './Property-Create-Edit-Form-Step-Three';

import styles from './Property-Create-Edit-Form.module.css';

export default function PropertyCreateEditForm() {
    const { data: propertyTypes } = useBasicGetFetch(() => propertyAPI.getPropertyTypes());
    const { data: facilities } = useBasicGetFetch(() => propertyAPI.getFacilities());
    const { propertyData, propertyFacilities } = usePropertyContext();

    const [menualErrors, setMenualErrors] = useState({});
    const [step, setStep] = useState(1);

    const navigate = useNavigate();

    const { register, control, handleSubmit, trigger, formState: { errors }, reset, watch } = useForm({
        defaultValues: {
            "step-2": {
                commonFacilityIds: [],
                accessibilityIds: []
            }
            //rooms: []
        },
        mode: 'onChange',
        resolver: yupResolver(propertySchema),
        context: { step },
    });

    useEffect(() => {
        if (propertyData) {
            reset({
                "id": propertyData._id,
                "step-1": {
                    name: propertyData.name,
                    typeId: propertyData.typeId,
                    starsCount: propertyData.starsCount,
                    checkIn: propertyData.checkIn,
                    checkOut: propertyData.checkOut,
                    address: propertyData.address,
                    description: propertyData.description,
                },
                "step-2": {
                    commonFacilityIds: propertyFacilities
                        .filter(pf => pf.isForAccessibility === false)
                        .map(pf => pf.facilityId),
                    accessibilityIds: propertyFacilities
                        .filter(pf => pf.isForAccessibility)
                        .map(pf => pf.facilityId),
                },
                "step-3": {
                    imageUrls: propertyData.imageUrls?.map((iu, i) => ({ id: i + 1, url: iu })),
                }
            });
        }
    }, [propertyData]);

    const updateMenualErrorsHandler = (errors) =>
        setMenualErrors(previousMenualErrors => ({ ...previousMenualErrors, ...errors }));

    const nextStep = async () => {
        const isStepValid = await trigger(`step-${step}`);

        if (isStepValid) {
            setStep(step + 1);
        }
    };

    const prevStep = () => setStep(step - 1);

    const createHandler = async (data) => {
        const propertyData = {
            ...data["step-1"],
            imageUrls: data["step-3"].imageUrls.map(iu => iu.url)
        };

        const createdPropertyData = data.id
            ? await propertyAPI.edit(data.id, propertyData)
            : await propertyAPI.create(propertyData);

        const facilityIds = [...data["step-2"].commonFacilityIds, ...data["step-2"].accessibilityIds];

        const propertyFacilitiesToDelete = propertyFacilities
            .filter(pf => facilityIds.includes(pf.facilityId) === false)
            .map(pf => pf.recordId);
        
        for (const facilityId of facilityIds) {
            if (propertyFacilities.some(pf => pf.facilityId === facilityId) === false) {
                await propertyAPI.createPropertyFacility({
                    propertyId: createdPropertyData._id,
                    facilityId
                });
            }
        }

        for (const propertyFacilityToDelete of propertyFacilitiesToDelete) {
            await propertyAPI.deletePropertyFacility(propertyFacilityToDelete);
        }

        toast.success(`You have successfully ${data.id === undefined ? "listed" : "edited"} your property.`);
        navigate("/my-properties");
    };

    return (
        <Container className="mt-3">
            <h1 className="text-center">List you property</h1>
            <Form onSubmit={handleSubmit(createHandler)}>

                <div className={styles["list-property-nav"]}>
                    <span><i className="fas fa-hotel text-primary"></i> Basic information</span>
                    <span><i className="fab fa-accessible-icon text-primary"></i> Facilities</span>
                    <span><i className="far fa-images text-primary"></i> Photos</span>
                </div>

                <input type="hidden" {...register("id")} />

                {step === 1 && <PropertyCreateEditFormStepOne
                    propertyTypes={propertyTypes}
                    register={register}
                    errors={errors["step-1"]}
                    nextStepHandler={nextStep}
                />}

                {step === 2 && <PropertyCreateEditFormStepTwo
                    facilities={facilities}
                    watch={watch}
                    register={register}
                    errors={errors["step-2"]}
                    previousStepHandler={prevStep}
                    nextStepHandler={nextStep}
                />}

                {step === 3 && <PropertyCreateEditFormStepThree
                    control={control}
                    errors={{ ...errors["step-3"], ...menualErrors }}
                    updateMenualErrorsHandler={updateMenualErrorsHandler}
                    previousStepHandler={prevStep}
                />}
            </Form>
        </Container>
    );
};
