import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

export function useCustomForm(validationSchema) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(validationSchema),
    });

    return {
        register,
        handleSubmit,
        errors,
        reset
    }
}