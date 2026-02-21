import { useState, useCallback, useEffect } from "react";

const DEFAULT_ERROR_MESSAGE = "Invalid value";

const extractIssueMessage = (
  issue,
  fallbackMessage = DEFAULT_ERROR_MESSAGE
) => {
  if (!issue) {
    return fallbackMessage;
  }

  if (typeof issue === "string") {
    return issue;
  }

  if (issue.message) {
    return issue.message;
  }

  return fallbackMessage;
};

const findIssueForField = (issues, field) => {
  if (!Array.isArray(issues)) {
    return undefined;
  }

  return issues.find((issue) => {
    if (!issue) {
      return false;
    }

    const path = Array.isArray(issue.path) ? issue.path[0] : issue.path;
    return path === field;
  });
};

const mapIssuesToErrors = (issues) => {
  if (!Array.isArray(issues)) {
    return {};
  }

  return issues.reduce((acc, issue) => {
    if (!issue) {
      return acc;
    }

    const path = Array.isArray(issue.path) ? issue.path[0] : issue.path;
    if (path !== undefined) {
      acc[path] = issue.message || DEFAULT_ERROR_MESSAGE;
    }

    return acc;
  }, {});
};

const useFormValidation = ({
  initialValues = {},
  validationSchema,
  onSubmit,
  onChange,
  enableReinitialize = false,
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runFieldValidation = useCallback(
    async (field, value, allValues) => {
      if (!validationSchema) {
        return "";
      }

      const currentValues = allValues ?? { ...values, [field]: value };

      try {
        if (typeof validationSchema.validateAt === "function") {
          await validationSchema.validateAt(field, currentValues);
          return "";
        }

        if (typeof validationSchema.pick === "function") {
          validationSchema.pick({ [field]: true }).parse({ [field]: value });
          return "";
        }

        if (typeof validationSchema.safeParse === "function") {
          const result = validationSchema.safeParse(currentValues);
          if (result.success) {
            return "";
          }

          const issue = findIssueForField(result.error.issues, field);
          return extractIssueMessage(issue);
        }

        if (typeof validationSchema.parse === "function") {
          validationSchema.parse(currentValues);
          return "";
        }

        return "";
      } catch (error) {
        if (error?.inner && Array.isArray(error.inner)) {
          const issue = error.inner.find((item) => item.path === field);
          return extractIssueMessage(issue);
        }

        if (error?.issues || error?.errors) {
          const issue = findIssueForField(error.issues || error.errors, field);
          return extractIssueMessage(issue);
        }

        return error?.message || DEFAULT_ERROR_MESSAGE;
      }
    },
    [validationSchema, values]
  );

  const runFormValidation = useCallback(
    async (allValues) => {
      if (!validationSchema) {
        return {};
      }

      const currentValues = allValues ?? values;

      try {
        if (typeof validationSchema.validate === "function") {
          await validationSchema.validate(currentValues, { abortEarly: false });
          return {};
        }

        if (typeof validationSchema.safeParse === "function") {
          const result = validationSchema.safeParse(currentValues);
          if (result.success) {
            return {};
          }

          return mapIssuesToErrors(result.error.issues);
        }

        if (typeof validationSchema.parse === "function") {
          validationSchema.parse(currentValues);
          return {};
        }

        return {};
      } catch (error) {
        if (error?.inner && Array.isArray(error.inner)) {
          return error.inner.reduce((acc, issue) => {
            if (!issue) {
              return acc;
            }

            if (issue.path !== undefined) {
              acc[issue.path] = issue.message || DEFAULT_ERROR_MESSAGE;
            }

            return acc;
          }, {});
        }

        if (error?.issues || error?.errors) {
          return mapIssuesToErrors(error.issues || error.errors);
        }

        if (error?.message) {
          return { FORM_ERROR: error.message };
        }

        return { FORM_ERROR: DEFAULT_ERROR_MESSAGE };
      }
    },
    [validationSchema, values]
  );

  const handleChange = useCallback(
    (event) => {
      const { name, value, checked, type } = event.target;
      const fieldValue = type === "checkbox" ? checked : value;

      setValues((prev) => {
        const nextValues = { ...prev, [name]: fieldValue };

        if (onChange) {
          onChange(nextValues);
        }

        if (touched[name]) {
          runFieldValidation(name, fieldValue, nextValues).then(
            (errorMessage) => {
              setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: errorMessage || undefined,
              }));
            }
          );
        }

        return nextValues;
      });
    },
    [onChange, runFieldValidation, touched]
  );

  const handleBlur = useCallback(
    (event) => {
      const { name } = event.target;

      setTouched((prev) => ({ ...prev, [name]: true }));

      const currentValue = values[name];
      runFieldValidation(name, currentValue).then((errorMessage) => {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: errorMessage || undefined,
        }));
      });
    },
    [runFieldValidation, values]
  );

  const setFieldValue = useCallback(
    (field, value, options = {}) => {
      const { shouldValidate = true } = options;

      setValues((prev) => {
        const nextValues = { ...prev, [field]: value };

        if (onChange) {
          onChange(nextValues);
        }

        if (shouldValidate) {
          runFieldValidation(field, value, nextValues).then((errorMessage) => {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [field]: errorMessage || undefined,
            }));
          });
        }

        return nextValues;
      });
    },
    [onChange, runFieldValidation]
  );

  const getFieldValue = useCallback((field) => values[field], [values]);

  const validateField = useCallback(
    (field) => {
      const currentValue = values[field];
      return runFieldValidation(field, currentValue);
    },
    [runFieldValidation, values]
  );

  const validateForm = useCallback(
    () => runFormValidation(values),
    [runFormValidation, values]
  );

  const resetForm = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  const handleSubmit = useCallback(
    async (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      setIsSubmitting(true);

      const allFieldsTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allFieldsTouched);

      const validationErrors = await runFormValidation(values);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length === 0 && onSubmit) {
        try {
          await onSubmit(values, {
            setErrors,
            setTouched,
            setSubmitting: setIsSubmitting,
            resetForm,
            setFieldValue,
          });
        } catch (error) {
          console.error("Form submission error", error);
        }
      }

      setIsSubmitting(false);
    },
    [onSubmit, runFormValidation, setFieldValue, resetForm, values]
  );

  useEffect(() => {
    if (!enableReinitialize) {
      return;
    }

    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [enableReinitialize, initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    getFieldValue,
    setErrors,
    setTouched,
    setIsSubmitting,
    validateField,
    validateForm,
    resetForm,
  };
};

export default useFormValidation;
