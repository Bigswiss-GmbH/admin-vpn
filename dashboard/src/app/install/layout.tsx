import { globalMetaTitle } from "@utils/meta";
import type { Metadata } from "next";
import BlankLayout from "@/layouts/BlankLayout";

export const metadata: Metadata = {
  title: `Installation - ${globalMetaTitle}`,
};
export default BlankLayout;
