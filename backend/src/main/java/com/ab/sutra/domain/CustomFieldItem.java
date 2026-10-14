package com.ab.sutra.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldItem implements Serializable {
    private String id;
    private String key;
    private String label;
    private String value;
    private FieldType fieldType;

    public enum FieldType {
        TEXT,
        NUMBER,
        DATE,
        CURRENCY,
        SELECT
    }
}
