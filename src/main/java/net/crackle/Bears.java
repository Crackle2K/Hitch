package net.crackle;

import net.fabricmc.api.ModInitializer;

import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.minecraft.world.level.levelgen.GenerationStep;
import net.minecraft.data.worldgen.placement.VegetationPlacements;
import net.minecraft.tags.BiomeTags;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Bears implements ModInitializer {
	public static final String MOD_ID = "bears";

	// This logger is used to write text to the console and the log file.
	// It is considered best practice to use your mod id as the logger's name.
	// That way, it's clear which mod wrote info, warnings, and errors.
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	@Override
	public void onInitialize() {
		// This code runs as soon as Minecraft is in a mod-load-ready state.
		// However, some things (like resources) may still be uninitialized.
		// Proceed with mild caution.

		LOGGER.info("Hello Fabric world!");

		// Modify taiga biomes to have increased bee nest spawn rates (similar to meadows)
		BiomeModifications.addFeature(
			BiomeSelectors.tag(BiomeTags.IS_TAIGA),
			GenerationStep.Decoration.VEGETAL_DECORATION,
			VegetationPlacements.TREES_MEADOW
		);

		LOGGER.info("Modified taiga biomes to spawn more bee nests!");
	}
}